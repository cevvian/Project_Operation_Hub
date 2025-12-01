import { Injectable, OnModuleInit } from '@nestjs/common';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { User } from 'src/database/entities/user.entity';
import { Role } from 'src/database/entities/enum/role.enum';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from "bcrypt";

@Injectable()
export class ApplicationInitService implements OnModuleInit {
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,
    ){}

    async onModuleInit(){
        const admin = await this.usersRepository.findOne({
            where: {role: Role.ADMIN}
        })

        if(!admin) {
            const user = await this.usersRepository.create({
                name: "Admin",
                email: "admin@gmail.com",
                password: await bcrypt.hash('adminadmin', 10),
                isVerified: true,
                role: Role.ADMIN
            });

            await this.usersRepository.save(user)

            const existing = await this.usersRepository.findOne({
                where: {email: "admin@gmail.com"}
            })
            if(!existing)
                throw new AppException(ErrorCode.CREATE_FAILED)

            console.log('Admin account created. Default password is : adminadmin. Please change it soon!');
        }
    }
}