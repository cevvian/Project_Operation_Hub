import { BadRequestException, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import { ForbiddenException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Project } from 'src/database/entities/project.entity';
import { Repository } from 'typeorm';
import { UsersService } from '../users/users.service';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { ProjectMember } from 'src/database/entities/project-member.entity';
import { InviteProjectMemberDto } from './dto/invite-project-member.dto';
import { PendingProjectInvitation } from 'src/database/entities/pending-project-invitation.entity';
import { User } from 'src/database/entities/user.entity';
import { EmailService } from '../email/email.service';


@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(PendingProjectInvitation)
    private readonly invitationRepo: Repository<PendingProjectInvitation>,

    private readonly usersService: UsersService,
    private readonly emailService: EmailService,
  ) {}

  async getMyProject(page: number, limit: number, userId: string) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    const qb = this.projectRepo
      .createQueryBuilder('project')
      .leftJoin('project.owner', 'owner')
      .leftJoin('project.members', 'member')
      .leftJoin('member.user', 'memberUser')
      .where('owner.id = :userId OR memberUser.id = :userId', { userId })
      .orderBy('project.created_at', 'DESC')
      .distinct(true);

    const [data, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    // Ensure owner is loaded for UI
    await Promise.all(
      data.map(async (p) => {
        if (!p.owner) {
          const full = await this.projectRepo.findOne({ where: { id: p.id }, relations: ['owner'] });
          if (full?.owner) (p as any).owner = full.owner;
        }
      })
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(dto: CreateProjectDto, ownerId: string) {
    const owner = await this.usersService.findOne(ownerId);

    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      owner: owner,
      keyPrefix: dto.keyPrefix
    });

    const savedProject = await this.projectRepo.save(project);

    // Add owner as a project member
    const projectMember = this.projectMemberRepo.create({
      project: savedProject,
      user: owner,
    });
    await this.projectMemberRepo.save(projectMember);

    return savedProject;
  }

  async inviteMembers(projectId: string, dto: InviteProjectMemberDto, requestingUserId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['owner', 'members', 'members.user', 'pendingInvitations'],
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    // 1. Authorization: Only the project owner can invite members.
    if (project.owner.id !== requestingUserId) {
      throw new ForbiddenException('Only the project owner can invite members.');
    }

    const existingEmails = new Set([
      ...project.members.map((m) => m.user.email),
      ...project.pendingInvitations
        .filter((i) => i.status === 'pending')
        .map((i) => i.email),
    ]);

    const newInvitations: Partial<PendingProjectInvitation>[] = [];
    const results: { success: string[]; failed: { email: string; reason: string }[] } = {
      success: [],
      failed: [],
    };

        const emailsToInvite = new Set(dto.emails?.filter(e => e) || []);

    // Handle userIds first
    if (dto.userIds) {
      for (const userId of dto.userIds) {
        const user = await this.userRepo.findOneBy({ id: userId });
        if (!user) {
          results.failed.push({ email: `ID:${userId}`, reason: 'User not found.' });
          continue;
        }
        if (existingEmails.has(user.email)) {
          results.failed.push({ email: user.email, reason: 'Already a member or invitation is pending.' });
          continue;
        }
        // Add to the set of emails to process, to avoid duplicating invites if both id and email are sent
        emailsToInvite.add(user.email);
      }
    }

    // Process all unique emails
    for (const email of emailsToInvite) {
      if (existingEmails.has(email)) {
        // This check is slightly redundant if emails come from userIds, but safe to have
        results.failed.push({ email, reason: 'Already a member or invitation is pending.' });
        continue;
      }

      const user = await this.userRepo.findOneBy({ email });
      const token = crypto.randomBytes(20).toString('hex');
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Invitation valid for 7 days

      newInvitations.push({
        project,
        email,
        user: user ?? undefined,
        token,
        expiresAt,
        status: 'pending',
      });

      existingEmails.add(email); // Avoid duplicate processing in the same batch
      results.success.push(email);
    }

    if (newInvitations.length > 0) {
      const savedInvitations = await this.invitationRepo.save(newInvitations);

      // Send emails sequentially with a slight delay to avoid SMTP throttling
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      for (const invitation of savedInvitations) {
        try {
          await this.emailService.sendProjectInvitationEmail(
            invitation.email,
            project.owner.name,
            project.name,
            invitation.token,
          );
          await sleep(200); // throttle a bit
        } catch (err) {
          results.failed.push({ email: invitation.email, reason: 'Failed to send email' });
          console.error(`Failed to send invitation email to ${invitation.email}:`, err);
        }
      }
    }

    return {
      message: 'Invitation process completed.',
      ...results,
    };
  }

  async getInvitationDetails(token: string) {
    const invitation = await this.invitationRepo.findOne({
      where: { token },
      relations: ['project'],
    });

    if (!invitation || invitation.status !== 'pending') {
      throw new AppException(ErrorCode.INVITATION_NOT_FOUND);
    }

    if (invitation.expiresAt < new Date()) {
      // Optionally update status to 'expired'
      await this.invitationRepo.update(invitation.id, { status: 'expired' });
      throw new AppException(ErrorCode.INVITATION_EXPIRED);
    }

    const userExists = !!(await this.userRepo.findOneBy({ email: invitation.email }));

    return {
      email: invitation.email,
      projectId: invitation.project.id,
      projectName: invitation.project.name,
      userExists,
    };
  }

  async acceptInvitation(token: string, requestingUserId: string) {
    // 1. Find user and invitation
    const user = await this.userRepo.findOneBy({ id: requestingUserId });
    if (!user) {
      throw new AppException(ErrorCode.USER_NOT_EXISTED);
    }

    const invitation = await this.invitationRepo.findOne({
      where: { token, status: 'pending' },
      relations: ['project'],
    });

    if (!invitation) {
      throw new AppException(ErrorCode.INVITATION_NOT_FOUND);
    }

    // 2. Security Check: Ensure the logged-in user's email matches the invitation email
    if (invitation.email !== user.email) {
      throw new ForbiddenException('This invitation is for a different user.');
    }

    // 3. Check expiration
    if (invitation.expiresAt < new Date()) {
      await this.invitationRepo.update(invitation.id, { status: 'expired' });
      throw new AppException(ErrorCode.INVITATION_EXPIRED);
    }

    // 4. Check if user is already a member
    const count = await this.projectMemberRepo.count({
      where: { project: { id: invitation.project.id }, user: { id: user.id } }
    });
    const isAlreadyMember = count > 0;

    if (isAlreadyMember) {
      // If already a member, just mark invitation as accepted and return success
      await this.invitationRepo.update(invitation.id, { status: 'accepted' });
      return {
        message: 'User is already a member of the project.',
        projectId: invitation.project.id,
      };
    }

    // 5. Add user to project
    const projectMember = this.projectMemberRepo.create({
      project: invitation.project,
      user: user,
    });
    await this.projectMemberRepo.save(projectMember);

    // 6. Mark invitation as accepted
    await this.invitationRepo.update(invitation.id, { status: 'accepted', user: user });

    return {
      message: `Successfully joined project ${invitation.project.name}`,
      projectId: invitation.project.id,
    };
  }

  async removeMember(projectId: string, userId: string, requestingUserId: string) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['owner'],
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    // 1. Authorization: Only the project owner can remove members.
    if (project.owner.id !== requestingUserId) {
      throw new ForbiddenException('Only the project owner can remove members.');
    }

    // 2. Business rule: The owner cannot remove themselves.
    if (project.owner.id === userId) {
      throw new BadRequestException('The project owner cannot be removed.');
    }

    // 3. Find and delete the member
    const result = await this.projectMemberRepo.delete({
      project: { id: projectId },
      user: { id: userId },
    });

    if (result.affected === 0) {
      throw new AppException(ErrorCode.USER_NOT_MEMBER);
    }

    return { message: 'Member removed successfully' };
  }

  async getProjectMembers(projectId: string) {
    const project = await this._findProjectById(projectId);
    // Use a Set to prevent duplicates if the owner is also in the members list
    const memberMap = new Map<string, { id: string; name: string; email: string }>();

    // Add all active members
    project.members.forEach((member) => {
      memberMap.set(member.user.id, {
        id: member.user.id,
        name: member.user.name,
        email: member.user.email,
      });
    });

    // Ensure the owner is included
    if (project.owner) {
      memberMap.set(project.owner.id, {
        id: project.owner.id,
        name: project.owner.name,
        email: project.owner.email,
      });
    }

    return Array.from(memberMap.values());
  }

  async searchUsersToInvite(projectId: string, query: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['members', 'members.user', 'pendingInvitations'],
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    const existingEmails = new Set([
      ...project.members.map((m: ProjectMember) => m.user.email),
      ...project.pendingInvitations
        .filter((i: PendingProjectInvitation) => i.status === 'pending')
        .map((i: PendingProjectInvitation) => i.email),
    ]);

    const users = await this.userRepo
      .createQueryBuilder('user')
      .where('user.isVerified = :isVerified', { isVerified: true })
      .andWhere('(user.name ILIKE :query OR user.email ILIKE :query)', {
        query: `%${query}%`,
      })
      .getMany();

    const result = users
      .filter((user) => !existingEmails.has(user.email))
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
      }));

    return {
      message: 'Success',
      result,
    };
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await this.projectRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['owner'],
      order: { created_at: 'DESC' },
    });

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  private async _findProjectById(id: string): Promise<Project> {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user', 'pendingInvitations'],
    });
    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }
    return project;
  }

  async findOne(id: string) {
    const project = await this._findProjectById(id);

    // Format the response for the frontend
    const activeMembers = project.members.map((member) => ({
      userId: member.user.id,
      name: member.user.name,
      email: member.user.email,
      joinedAt: member.joinedAt,
      status: 'active',
    }));

    const pendingMembers = project.pendingInvitations
      .filter((invitation) => invitation.status === 'pending')
      .map((invitation) => ({
        userId: null,
        name: null, // Name is unknown until they accept
        email: invitation.email,
        joinedAt: null,
        status: 'pending',
      }));

    return {
      ...project,
      members: [...activeMembers, ...pendingMembers],
      pendingInvitations: undefined, // Remove redundant data
    };
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this._findProjectById(id); // Use the private method to get the raw entity

    // if (dto.ownerId && dto.ownerId !== project.owner.id) {
    //   project.owner = await this.usersService.findOne(dto.ownerId);
    // }

    Object.assign(project, {
      name: dto.name ?? project.name,
      description: dto.description ?? project.description,
    });

    return await this.projectRepo.save(project);
  }

  async remove(id: string) {
    await this.findOne(id);

    const result = await this.projectRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }
}
