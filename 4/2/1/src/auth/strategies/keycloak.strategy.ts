import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, StrategyOptions } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
<<<<<<< HEAD
import jwksClient from 'jwks-rsa';
=======
import { JwksClient } from 'jwks-rsa'; // ← импортируем класс
>>>>>>> 06cf2b8 (chapter 4.2.1 added section data in config map and fix keycloak strategy)

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger = new Logger(KeycloakStrategy.name);
  private jwksClientInstance: ReturnType<typeof jwksClient> | null = null;

  constructor(private config: ConfigService) {
<<<<<<< HEAD
    super({
=======
    const issuer = config.get<string>('KEYCLOAK_ISSUER');

    // Создаём через new
    const client = new JwksClient({
      jwksUri: `${issuer}/protocol/openid-connect/certs`,
      timeout: 5000,
      cache: true,
    });

    const options: StrategyOptions = {
>>>>>>> 06cf2b8 (chapter 4.2.1 added section data in config map and fix keycloak strategy)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      algorithms: ['RS256'],
      secretOrKey: null,
      secretOrKeyProvider: (header, payload, done) => {
<<<<<<< HEAD
        try {
          if (!this.jwksClientInstance) {
            const issuer = this.config.get<string>('KEYCLOAK_ISSUER', '');
            if (!issuer) {
              return done(new Error('KEYCLOAK_ISSUER is not set in environment'));
            }
            this.jwksClientInstance = jwksClient({
              jwksUri: `${issuer}/protocol/openid-connect/certs`,
              timeout: 5000,
              cache: true,
            });
=======
        if (!header?.kid) {
          return done(new UnauthorizedException('Missing kid in JWT header'));
        }
        client.getSigningKey(header.kid, (err, key) => {
          if (err) {
            this.logger.error(`JWKS error: ${err.message}`);
            return done(new UnauthorizedException('Unable to verify token'));
>>>>>>> 06cf2b8 (chapter 4.2.1 added section data in config map and fix keycloak strategy)
          }

          if (!header?.kid) {
            return done(new UnauthorizedException('Missing kid in JWT header'));
          }

          this.jwksClientInstance.getSigningKey(header.kid, (err, key) => {
            if (err) {
              this.logger.error(`JWKS error: ${err.message}`);
              return done(new UnauthorizedException('Unable to verify token'));
            }
            const signingKey = key.getPublicKey();
            done(null, signingKey);
          });
        } catch (error) {
          done(error);
        }
      },
    };

    super(options);
  }

  validate(payload: any): any {
    const expectedIssuer = this.config.get<string>('KEYCLOAK_ISSUER');
    if (payload.iss !== expectedIssuer) {
      throw new UnauthorizedException('Invalid token issuer');
    }
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }
    return payload;
  }
}