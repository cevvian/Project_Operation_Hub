// user-team-role.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Team } from './team.entity';

export enum TeamRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity({ name: 'user_team_roles' })
export class UserTeamRole {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => User, (u) => u.teamRoles, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne(() => Team, (t) => t.members, { onDelete: 'CASCADE' })
  team: Team;

  @Column({ type: 'enum', enum: TeamRole })
  role: TeamRole;

  @CreateDateColumn()
  joined_at: Date;
}
