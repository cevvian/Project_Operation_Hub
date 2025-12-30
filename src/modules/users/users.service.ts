import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { In, Repository, ILike, FindOptionsWhere } from 'typeorm';
import { UserStatus } from 'src/database/entities/enum/user-status.enum';
import { Role } from 'src/database/entities/enum/role.enum';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import * as bcrypt from 'bcrypt';
import { GithubService } from '../github/github.service';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly githubService: GithubService,
  ) { }

  async create(createUserDto: CreateUserDto): Promise<User> {
    const existingUser = await this.userRepo.findOne({ where: { email: createUserDto.email } });
    if (existingUser) {
      // Instead of returning, throw an error to be more explicit.
      // throw new AppException(ErrorCode.USER_EMAIL_EXISTED);
      return existingUser;
    }

    const user = this.userRepo.create({
      ...createUserDto,
      password: createUserDto.password ? await bcrypt.hash(createUserDto.password, 10) : undefined,
      status: createUserDto.status || UserStatus.UNVERIFIED,
      role: createUserDto.platform_role || Role.USER,
    });

    return this.userRepo.save(user);
  }

  async validate(email: string, password: string) {
    const user = await this.findUserByEmail(email)

    if (user.status !== UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.USER_INACTIVE);
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password)
    if (!isCorrectPassword) {
      throw new UnauthorizedException('Password not correct')
    }

    return user;
  }

  async verifyAccount(userId: string) {
    const user = await this.findOne(userId)
    user.status = UserStatus.ACTIVE
    return await this.userRepo.save(user)
  }

  async updateStatus(userId: string, status: UserStatus) {
    const user = await this.findOne(userId);

    // Validation: Can only lock ACTIVE users
    if (status === UserStatus.LOCKED && user.status !== UserStatus.ACTIVE) {
      throw new AppException(ErrorCode.INVALID_USER_STATUS_TRANSITION);
    }

    // Validation: Can only unlock LOCKED users
    if (status === UserStatus.ACTIVE && user.status !== UserStatus.LOCKED) {
      throw new AppException(ErrorCode.INVALID_USER_STATUS_TRANSITION);
    }

    user.status = status;
    return await this.userRepo.save(user);
  }

  async findUsers(userIds: string[]) {
    const users = await this.userRepo.find({
      where: { id: In(userIds) },
    });

    if (users.length !== userIds.length) {
      throw new AppException(ErrorCode.ONE_OF_USERS_NOT_FOUND);
    }

    return users
  }

  async createGitHubName(username: string, userId: string) {
    const user = await this.findOne(userId);

    const exists = await this.githubService.checkGithubUsernameExists(username, user.githubToken);

    if (!exists) {
      throw new AppException(ErrorCode.GITHUB_USERNAME_NOT_FOUND);
    }

    user.githubName = username;
    return await this.userRepo.save(user);
  }

  async createGitHubToken(token: string, userId: string) {
    const user = await this.findOne(userId)
    user.githubToken = token
    return await this.userRepo.save(user)
  }

  async findAll(page: number, limit: number, search?: string, role?: string) {
    const where: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};

    if (search) {
      // Search by name OR email
      // Note: when using OR with other conditions (like role), we need array (OR) of objects
      if (role) {
        // (name LIKE %search% AND role = role) OR (email LIKE %search% AND role = role)
        const roleFilter = role as any;
        Object.assign(where, [
          { name: ILike(`%${search}%`), role: roleFilter },
          { email: ILike(`%${search}%`), role: roleFilter },
        ]);
      } else {
        // name LIKE %search% OR email LIKE %search%
        Object.assign(where, [
          { name: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]);
      }
    } else if (role) {
      // Only role filter
      Object.assign(where, { role: role as any });
    }

    // Since 'where' logic above with Object.assign on initial {} might be tricky with how TypeORM handles [] vs {},
    // let's assign explicitly.
    let findConditions: FindOptionsWhere<User> | FindOptionsWhere<User>[] = {};

    if (search && role) {
      findConditions = [
        { name: ILike(`%${search}%`), role: role as any },
        { email: ILike(`%${search}%`), role: role as any }
      ];
    } else if (search) {
      findConditions = [
        { name: ILike(`%${search}%`) },
        { email: ILike(`%${search}%`) }
      ];
    } else if (role) {
      findConditions = { role: role as any };
    }

    const [data, total] = await this.userRepo.findAndCount({
      where: findConditions,
      skip: (page - 1) * limit,
      take: limit,
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
    const user = await this.userRepo.findOne({
      where: { id: id },
    })

    if (!user)
      throw new AppException(ErrorCode.USER_NOT_EXISTED);

    return user;
  }

  async findUserByEmail(email: string) {
    const user = await this.userRepo.findOne({
      where: { email: email }
    })

    if (!user)
      throw new AppException(ErrorCode.USER_NOT_EXISTED)

    return user
  }

  async findUserByGithubName(githubName: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { githubName: githubName },
    });
  }

  async findUserByGoogleId(googleId: string): Promise<User | null> {
    return this.userRepo.findOne({
      where: { googleId: googleId },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id)

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.checkExistedProperty(updateUserDto.email);
    }
    if (updateUserDto.name && updateUserDto !== user.name) {
      await this.checkExistedProperty(updateUserDto.name);
    }
    if (updateUserDto.password) {
      user.password = await bcrypt.hash(updateUserDto.password, 10)
    }

    // Update fields from DTO
    user.name = updateUserDto.name || user.name;
    // user.avatar = updateUserDto.avatar || user.avatar;
    user.githubToken = updateUserDto.github_token || user.githubToken;
    user.role = updateUserDto.platform_role || user.role;

    return await this.userRepo.save(user)
  }

  async updatePassword(id: string, newPassword: string) {
    const user = await this.findOne(id);
    user.password = await bcrypt.hash(newPassword, 10);
    return await this.userRepo.save(user);
  }


  async remove(id: string) {
    await this.findOne(id);

    const result = await this.userRepo.delete(id);

    if (result.affected && result.affected > 0) {
      return 'Delete successfully';
    } else {
      throw new AppException(ErrorCode.DELETE_FAIL);
    }
  }

  private async checkExistedProperty(email?: string, username?: string) {
    if (email) {
      const existing = await this.userRepo.findOne({
        where: { email: email }
      })

      if (existing)
        throw new AppException(ErrorCode.USER_EMAIL_EXISTED)
    }

    if (username) {
      const existing = await this.userRepo.findOne({
        where: { name: username }
      })

      if (existing)
        throw new AppException(ErrorCode.USER_USERNAME_EXISTED)
    }
  }

  async connectGithubAccount(userId: string, githubName: string): Promise<User> {
    // Check if another user has already taken this GitHub name
    const existingConnection = await this.findUserByGithubName(githubName);
    if (existingConnection && existingConnection.id !== userId) {
      throw new AppException(ErrorCode.GITHUB_USERNAME_NOT_FOUND)
    }

    const user = await this.findOne(userId);
    user.githubName = githubName;
    return this.userRepo.save(user);
  }

  /**
   * Get all user IDs (for broadcast targeting)
   */
  async getAllUserIds(): Promise<string[]> {
    const users = await this.userRepo.find({ select: ['id'] });
    return users.map(u => u.id);
  }

  /**
   * Get all admin user IDs (for targeted broadcasts)
   */
  async getAdminUserIds(): Promise<string[]> {
    const admins = await this.userRepo.find({
      where: [
        { role: 'ADMIN' as any },
        { role: 'SUPER_ADMIN' as any },
      ],
      select: ['id'],
    });
    return admins.map(a => a.id);
  }
}
