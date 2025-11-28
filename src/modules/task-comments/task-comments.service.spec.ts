import { Test, TestingModule } from '@nestjs/testing';
import { TaskCommentsService } from './task-comments.service';

describe('TaskCommentsService', () => {
  let service: TaskCommentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TaskCommentsService],
    }).compile();

    service = module.get<TaskCommentsService>(TaskCommentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
