import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { EmailService } from './email.service';
import { SendConfirmationMailDto } from './dto/send-email.dto';

@Controller('email')
export class EmailController {
  constructor(private readonly emailService: EmailService) {}

  @Post()
  sendEmail(@Body() sendEmailDto: SendConfirmationMailDto){
    return this.emailService.sendUserConfirmation(sendEmailDto.to, sendEmailDto.name)
  }
}