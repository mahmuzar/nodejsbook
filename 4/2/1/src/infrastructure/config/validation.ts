import { plainToInstance } from 'class-transformer';
import { IsString, IsInt, validateSync } from 'class-validator';

class EnvironmentVariables {
  @IsString()
  KEYCLOAK_ISSUER!: string;

  @IsInt()
  PORT!: number;
}

export const validationSchema = (config: Record<string, unknown>): EnvironmentVariables => {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });
  const errors = validateSync(validatedConfig, { skipMissingProperties: false });
  if (errors.length > 0) {
    throw new Error(errors.toString());
  }
  return validatedConfig;
};