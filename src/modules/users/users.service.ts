import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/database/entities/user.entity';
import { In, Repository } from 'typeorm';
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
  ){}

  async create(createUserDto: CreateUserDto) {
    const existing = await this.userRepo.findOne({
      where: {email: createUserDto.email}
    })

    if (existing) {
      return existing
    }

    const user = await this.userRepo.create({
      email: createUserDto.email,
      name: createUserDto.name,
      password: await bcrypt.hash(createUserDto.password, 10),
      githubToken: createUserDto.github_token,
    })

    return await this.userRepo.save(user)
  }

  async validate(email: string, password: string){
    const user = await this.findUserByEmail(email)

    if (!user.isVerified) {
      throw new AppException(ErrorCode.USER_INACTIVE);
    }

    const isCorrectPassword = await bcrypt.compare(password, user.password)
    if (!isCorrectPassword) {
        throw new UnauthorizedException('Password not correct')
    }

    return user;
  }

  async verifyAccount(userId: string){
    const user = await this.findOne(userId)
    user.isVerified = true
    return await this.userRepo.save(user)
  }

  async findUsers(userIds: string[]){
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

  async createGitHubToken(token: string, userId: string){
    const user = await this.findOne(userId)
    user.githubToken = token
    return await this.userRepo.save(user)
  }

  async findAll(page: number, limit: number) {
    const [data, total] = await this.userRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
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
      where: {id: id} ,
    })

    if(!user)
      throw new AppException(ErrorCode.USER_NOT_EXISTED);

    return user;
  }

  async findUserByEmail(email: string){
    const user = await this.userRepo.findOne({
      where: {email: email}
    })

    if(!user)
      throw new AppException(ErrorCode.USER_NOT_EXISTED)

    return user
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findOne(id)

    if (updateUserDto.email && updateUserDto.email !== user.email) {
      await this.checkExistedProperty(updateUserDto.email);
    }
    if (updateUserDto.name && updateUserDto !== user.name) {
      await this.checkExistedProperty(updateUserDto.name);
    }
    if(updateUserDto.password){
      user.password = await bcrypt.hash(updateUserDto.password, 10)
    }

    Object.assign(user, {
      email: updateUserDto.email || user.email,
      name: updateUserDto.name || user.name,
      githubToken: updateUserDto.github_token || user.githubToken,
      platformRole: updateUserDto.platform_role || user.role
    });

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

  private async checkExistedProperty(email?:string, username?:string){
    if(email){
      const existing = await this.userRepo.findOne({
        where: {email: email}
      })

      if(existing)
        throw new AppException(ErrorCode.USER_EMAIL_EXISTED)
    }

    if(username){
      const existing = await this.userRepo.findOne({
        where: {name: username}
      })

      if(existing)
        throw new AppException(ErrorCode.USER_USERNAME_EXISTED)
    }
  }
}
