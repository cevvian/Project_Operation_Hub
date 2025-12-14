import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, } from 'typeorm';
import { Task } from './task.entity';
import { User } from './user.entity';

@Entity('attachments')
export class Attachment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task: Task;

  @Column()
  filename: string;

  @Column()
  url: string;

  @Column({ nullable: true })
  size: number; // bytes

  @Column({ nullable: true })
  mimeType: string;

  @Column({ name: 'public_id', nullable: true })
  publicId: string; // lưu public_id trên Cloudinary

  @ManyToOne(() => User, (user) => user.attachments, {
    onDelete: 'SET NULL',
  })
  uploadedBy: User;

  @CreateDateColumn()
  createdAt: Date;
}
