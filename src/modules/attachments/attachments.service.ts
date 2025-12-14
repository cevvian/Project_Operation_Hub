import { Injectable } from '@nestjs/common';
import { CreateAttachmentDto } from './dto/create-attachment.dto';
import { UpdateAttachmentDto } from './dto/update-attachment.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Attachment } from 'src/database/entities/attachment.entity';
import { Task } from 'src/database/entities/task.entity';
import { User } from 'src/database/entities/user.entity';
import { AppException } from 'src/exceptions/app.exception';
import { ErrorCode } from 'src/exceptions/error-code';
import { Repository } from 'typeorm';
import { CloudinaryService } from '../cloudinary/cloudinary.service';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment)
    private readonly attachmentRepo: Repository<Attachment>,

    @InjectRepository(Task)
    private readonly taskRepo: Repository<Task>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,

    private readonly cloudinaryService: CloudinaryService
  ) {}


  async create(file: Express.Multer.File, dto: CreateAttachmentDto, userId: string) {
    if (!file) throw new AppException(ErrorCode.UNCATEGORIZED_EXCEPTION);

    const task = await this.taskRepo.findOne({ where: { id: dto.taskId } });
    if (!task) throw new AppException(ErrorCode.TASK_NOT_FOUND);

    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new AppException(ErrorCode.USER_NOT_EXISTED);

    const uploadResult = await this.cloudinaryService.uploadFile(file);

    const attachment = this.attachmentRepo.create({
      filename: file.originalname,
      url: (uploadResult as any).secure_url ?? (uploadResult as any).url ?? '',
      size: (uploadResult as any).bytes ?? file.size,
      mimeType: file.mimetype,
      publicId: (uploadResult as any).public_id ?? (uploadResult as any).publicId,
      task,
      uploadedBy: user,
    });

    return this.attachmentRepo.save(attachment);
  }

  async findAll(page = 1, limit = 10) {
    const [data, total] = await this.attachmentRepo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['task', 'uploadedBy'],
      order: { createdAt: 'DESC' },
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
    const attachment = await this.attachmentRepo.findOne({
      where: { id },
      relations: ['task', 'uploadedBy'],
    });
    if (!attachment) throw new AppException(ErrorCode.ATTACHMENT_NOT_FOUND);
    return attachment;
  }

  async findByTask(taskId: string) {
    return this.attachmentRepo.find({
      where: { task: { id: taskId } },
      relations: ['uploadedBy'],
      order: { createdAt: 'ASC' },
    });
  }

  async updateFile(id: string, file: Express.Multer.File | null) {
    const attachment = await this.findOne(id);

    // Nếu có file mới, xóa file cũ trên Cloudinary trước
    if (file) {
      if (attachment.publicId) {
        await this.cloudinaryService.deleteFile(attachment.publicId);
      }

      const uploadResult = (await this.cloudinaryService.uploadFile(file)) as any;

      attachment.url = uploadResult?.secure_url ?? uploadResult?.url ?? attachment.url;
      attachment.size = uploadResult?.bytes ?? file.size ?? attachment.size;
      attachment.mimeType = file.mimetype;
      attachment.publicId = uploadResult?.public_id ?? uploadResult?.publicId ?? attachment.publicId;
      attachment.filename = file.originalname;
    }

    return this.attachmentRepo.save(attachment);
  }

  async remove(id: string) {
    const attachment = await this.findOne(id);

    if (attachment.publicId) {
      await this.cloudinaryService.deleteFile(attachment.publicId);
    }

    const result = await this.attachmentRepo.delete(id);
    if (result.affected && result.affected > 0) return 'Deleted successfully';
      throw new AppException(ErrorCode.DELETE_FAIL);
  }
}
