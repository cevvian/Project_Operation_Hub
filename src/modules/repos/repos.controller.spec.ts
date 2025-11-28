import { Test, TestingModule } from '@nestjs/testing';
import { ReposController } from './repos.controller';
import { ReposService } from './repos.service';

describe('ReposController', () => {
  let controller: ReposController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ReposController],
      providers: [ReposService],
    }).compile();

    controller = module.get<ReposController>(ReposController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
