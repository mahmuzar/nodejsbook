import { plainToInstance } from 'class-transformer';
import { validateSync, IsString, IsInt } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  KEYCLOAK_ISSUER!: string;

  @IsInt()
  PORT!: number;
}

// Экспортируем ФУНКЦИЮ валидации (именно так ожидает @nestjs/config)
export function validate(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}