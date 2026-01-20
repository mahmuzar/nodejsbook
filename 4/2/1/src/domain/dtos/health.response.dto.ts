import { ApiProperty } from '@nestjs/swagger';

export class HealthResponseDto {
  @ApiProperty({ example: 'OK' })
  status: string;

  @ApiProperty({ example: '2026-01-16T12:00:00.000Z' })
  timestamp: string;
}