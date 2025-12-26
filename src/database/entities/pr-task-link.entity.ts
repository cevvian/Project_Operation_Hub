import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, } from 'typeorm';
import { PullRequest } from './pull-request.entity';
import { Task } from './task.entity';


@Entity('pr_task_links')
export class PRTaskLink {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PullRequest, (pr) => pr.taskLinks, {
    onDelete: 'CASCADE',
  })
  pullRequest: PullRequest;

  @ManyToOne(() => Task, (task) => task.prLinks, { onDelete: 'CASCADE' })
  task: Task;
}
