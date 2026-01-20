import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';
import { HealthResponseDto } from '../../domain/dtos/health.response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly useCase: CheckHealthUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Проверить состояние сервиса (публичный)' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  async handle(): Promise<HealthResponseDto> {
    const entity = await this.useCase.execute();
    return {
      status: entity.status,
      timestamp: entity.timestamp.toISOString(),
    };
  }
}