import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { validationSchema } from './infrastructure/config/validation';
import { HealthController } from './interfaces/controllers/health.controller';
import { ProtectedController } from './interfaces/controllers/protected.controller';
import { CheckHealthUseCase } from './application/use-cases/check-health.use-case';
import { IHealthChecker } from './domain/ports/health-checker.port';
import { InMemoryHealthChecker } from './infrastructure/adapters/in-memory-health-checker.adapter';
import { KeycloakStrategy } from './auth/strategies/keycloak.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, validationSchema }),
    PassportModule.register({ defaultStrategy: 'keycloak' }),
  ],
  controllers: [HealthController, ProtectedController],
  providers: [
    CheckHealthUseCase,
    {
      provide: IHealthChecker,
      useClass: InMemoryHealthChecker,
    },
    KeycloakStrategy,
  ],
})
export class AppModule {}