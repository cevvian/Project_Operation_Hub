import { BadRequestException, Injectable } from '@nestjs/common';
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

@Injectable()
export class ProjectsService {
  constructor(
    @InjectRepository(Project)
    private readonly projectRepo: Repository<Project>,
    @InjectRepository(ProjectMember)
    private readonly projectMemberRepo: Repository<ProjectMember>,
    @InjectRepository(PendingProjectInvitation)
    private readonly invitationRepo: Repository<PendingProjectInvitation>,

    private readonly usersService: UsersService,
  ) {}

  async create(dto: CreateProjectDto) {
    const owner = await this.usersService.findOne(dto.ownerId);

    const project = this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      owner: owner,
      keyPrefix: dto.keyPrefix
    });

    return await this.projectRepo.save(project);
  }

  async inviteMember( projectId: string, userId: string, role?: string, /* nếu cần, lưu role trong ProjectMember*/) {
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['members'],
    });
    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    const user = await this.usersService.findOne(userId);

    const existingMember = project.members.find(
      (m) => m.user && m.user.id === userId,
    );
    if (existingMember) {
      throw new BadRequestException(`User already invited or member: ${userId}`);
    }

    // Generate invitation token (valid 1 day)
    // const invitationToken = uuidv4();
    const invitationToken = 'sfowejiowgjwig';
    const expiresAt = new Date();
    // expiresAt.setDate(expiresAt.getDate() + 1); // 1 day

    // TODO: lưu token + projectId + userId vào DB nếu muốn track pending invitations

    if (user) {
      // User exists → send notification + email
      // TODO: Send notification to user about project invitation
      // TODO: Send email using EmailService with invitation link including token
    } else {
      // User does not exist → send email only
      // TODO: Send email with invitation link including token
    }

    const invitation = await this.invitationRepo.create({
      project,
      user,
      token: invitationToken,
      expiresAt
    })

    await this.invitationRepo.save(invitation)

    return {
      message: 'Invitation sent',
      userId,
      projectId,
      invitationToken,
      expiresAt,
    };
  }

  async inviteMembers(dto: InviteProjectMemberDto) {
    const results: {
      message: string;
      userId: string;
      projectId: string;
      invitationToken: string;
      expiresAt: Date;
    }[] = [];

    for (const m of dto.members) {
      const res = await this.inviteMember(dto.projectId, m.userId, m.role);
      results.push(res);
    }

    return {
      message: 'All invitations processed',
      invitations: results,
    };
  }

  async acceptInvitation(token: string) {
    // 1. Find pending invitation by token
    const invitation = await this.invitationRepo.findOne({
      where: { token },
      relations: ['project', 'user'],
    });

    if (!invitation) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    // 2. Check expiration
    if (invitation.expiresAt < new Date()) {
      throw new BadRequestException('Invitation has expired');
    }

    // 3. Check if user is already a member
    const existing = await this.projectMemberRepo.findOne({
      where: {
        project: { id: invitation.project.id },
        user: { id: invitation.user.id },
      },
    });

    if (existing) {
      throw new BadRequestException('User is already a member of the project');
    }

    // 4. Add user to project
    const projectMember = this.projectMemberRepo.create({
      project: invitation.project,
      user: invitation.user,
    });

    await this.projectMemberRepo.save(projectMember);

    // 5. Delete invitation or mark as accepted
    await this.invitationRepo.delete(invitation.id);

    return {
      message: `User ${invitation.user.name} has joined project ${invitation.project.name}`,
      projectId: invitation.project.id,
      userId: invitation.user.id,
    };
  }

  async removeMember(projectId: string, userId: string) {
    // 1. Lấy project để kiểm tra quyền
    const project = await this.projectRepo.findOne({
      where: { id: projectId },
      relations: ['owner'],
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND)
    }

    // 2. Kiểm tra quyền
    // if (requestUser.id !== project.owner.id && requestUser.role !== 'ADMIN') {
    //   throw new ForbiddenException('Only owner or admin can remove members');
    // }

    // 3. Tìm member
    const member = await this.projectMemberRepo.findOne({
      where: {
        project: { id: projectId },
        user: { id: userId },
      },
      relations: ['user', 'project'],
    });

    if (!member) {
      throw new AppException(ErrorCode.USER_NOT_MEMBER)
    }

    // 4. Xóa member
    await this.projectMemberRepo.remove(member);

    // 5. Lấy lại danh sách member của project
    const remainingMembers = await this.projectMemberRepo.find({
      where: { project: { id: projectId } },
      relations: ['user'],
    });

    // 6. Trả về kết quả
    return {
      message: 'Member removed successfully',
      projectId: project.id,
      members: remainingMembers.map((m) => ({
        userId: m.user.id,
        name: m.user.name,
        joinedAt: m.joinedAt,
      })),
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

  async findOne(id: string) {
    const project = await this.projectRepo.findOne({
      where: { id },
      relations: ['owner'],
    });

    if (!project) {
      throw new AppException(ErrorCode.PROJECT_NOT_FOUND);
    }

    return project;
  }

  async update(id: string, dto: UpdateProjectDto) {
    const project = await this.findOne(id);

    if (dto.ownerId && dto.ownerId !== project.owner.id) {
      project.owner = await this.usersService.findOne(dto.ownerId);
    }

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
