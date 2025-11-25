// pr-task-link.entity.ts
import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, } from 'typeorm';
import { PullRequest } from './pull-request.entity';
import { Task } from './task.entity';


@Entity('pr_task_links')
export class PRTaskLink {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => PullRequest, (pr) => pr.taskLinks, {
    onDelete: 'CASCADE',
  })
  pullRequest: PullRequest;

  @ManyToOne(() => Task, { onDelete: 'CASCADE' })
  task: Task;
}
