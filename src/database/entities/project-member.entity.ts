import { CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Project } from "./project.entity";
import { User } from "./user.entity";

@Entity({ name: 'project_members' })
export class ProjectMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Project, (project) => project.members, { onDelete: 'CASCADE' })
  project: Project;

  @ManyToOne(() => User, (user) => user.projectMemberships, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  joinedAt: Date;
}
