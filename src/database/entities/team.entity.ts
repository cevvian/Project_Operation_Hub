// team.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, CreateDateColumn, UpdateDateColumn, } from 'typeorm';
import { User } from './user.entity';
import { UserTeamRole } from './user-team-role.entity';
import { Project } from './project.entity';


export enum TeamType {
  PERSONAL = 'personal',
  TEAM = 'team',
}

@Entity({ name: 'teams' })
export class Team {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'enum', enum: TeamType })
  type: TeamType;

  @ManyToOne(() => User)
  owner_user: User;

  @OneToMany(() => UserTeamRole, (utr) => utr.team)
  members: UserTeamRole[];

  @OneToMany(() => Project, (p) => p.team)
  projects: Project[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
