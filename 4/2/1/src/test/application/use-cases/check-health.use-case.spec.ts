import { Test, TestingModule } from '@nestjs/testing';
import { CheckHealthUseCase } from '../../../../src/application/use-cases/check-health.use-case';
import { IHealthChecker, HealthCheckResult } from '../../../../src/domain/ports/health-checker.port';
import { HealthEntity } from '../../../../src/domain/entities/health.entity';

const mockHealthChecker: IHealthChecker = {
  check: jest.fn(),
};

describe('CheckHealthUseCase', () => {
  let useCase: CheckHealthUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CheckHealthUseCase,
        {
          provide: 'IHealthChecker',
          useValue: mockHealthChecker,
        },
      ],
    }).compile();

    useCase = module.get<CheckHealthUseCase>(CheckHealthUseCase);
  });

  it('should return HealthEntity', async () => {
    const mockResult: HealthCheckResult = {
      status: 'OK',
      timestamp: new Date('2026-01-16T12:00:00Z'),
    };
    (mockHealthChecker.check as jest.Mock).mockResolvedValue(mockResult);

    const result = await useCase.execute();
    expect(result).toBeInstanceOf(HealthEntity);
    expect(result.status).toBe('OK');
  });
});