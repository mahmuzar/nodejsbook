import { Injectable } from '@nestjs/common';
import { IHealthChecker, HealthCheckResult } from '../../domain/ports/health-checker.port';

@Injectable()
export class InMemoryHealthChecker extends IHealthChecker {
  async check(): Promise<HealthCheckResult> {
    return { status: 'OK', timestamp: new Date() };
  }
}