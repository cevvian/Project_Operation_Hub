import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm";
import { Repo } from "./repo.entity";
import { Task } from "./task.entity";

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => Task, task => task.branches)
  task: Task;

  @ManyToOne(() => Repo, repo => repo.branches)
  repo: Repo;

  @Column({ nullable: true })
  githubUrl: string;

  @CreateDateColumn()
  createdAt: Date;
}
