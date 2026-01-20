import { Injectable } from '@nestjs/common';
import { IHealthChecker, HealthCheckResult } from '../../domain/ports/health-checker.port';
import { HealthEntity } from '../../domain/entities/health.entity';

@Injectable()
export class CheckHealthUseCase {
  constructor(private readonly checker: IHealthChecker) {}

  async execute(): Promise<HealthEntity> {
    const result: HealthCheckResult = await this.checker.check();
    return new HealthEntity(result);
  }
}