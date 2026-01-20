export interface HealthCheckResult {
  status: string;
  timestamp: Date;
}

export abstract class IHealthChecker {
  abstract check(): Promise<HealthCheckResult>;
}