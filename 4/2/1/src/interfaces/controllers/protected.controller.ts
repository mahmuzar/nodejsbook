import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { KeycloakGuard } from '../../auth/guards/keycloak.guard';
import { HealthResponseDto } from '../../domain/dtos/health.response.dto';
import { CheckHealthUseCase } from '../../application/use-cases/check-health.use-case';

@ApiTags('Protected')
@Controller('api/data')
@UseGuards(KeycloakGuard)
@ApiBearerAuth('access-token')
export class ProtectedController {
  constructor(private readonly useCase: CheckHealthUseCase) {}

  @Get()
  @ApiOperation({ summary: 'Защищённый эндпоинт' })
  @ApiResponse({ status: 200, type: HealthResponseDto })
  @ApiResponse({ status: 401, description: 'Требуется валидный JWT от Keycloak' })
  async getData(@Request() req): Promise<HealthResponseDto> {
    console.log('User:', req.user);
    const entity = await this.useCase.execute();
    return {
      status: entity.status,
      timestamp: entity.timestamp.toISOString(),
    };
  }
}