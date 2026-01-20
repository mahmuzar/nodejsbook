import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import * as jwksClient from 'jwks-rsa';

@Injectable()
export class KeycloakStrategy extends PassportStrategy(Strategy, 'keycloak') {
  private readonly logger = new Logger(KeycloakStrategy.name);

  constructor(private config: ConfigService) {
    const issuer = config.get<string>('KEYCLOAK_ISSUER');
    const client = jwksClient({
      jwksUri: `${issuer}/protocol/openid-connect/certs`,
      timeout: 5000,
      cache: true,
    });

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      issuer,
      algorithms: ['RS256'],
      secretOrKeyProvider: (header, payload, done) => {
        if (!header?.kid) {
          return done(new UnauthorizedException('Missing kid in JWT header'));
        }
        client.getSigningKey(header.kid, (err, key) => {
          if (err) {
            this.logger.error(`JWKS error: ${err.message}`);
            return done(new UnauthorizedException('Unable to verify token'));
          }
          const signingKey = key.getPublicKey();
          done(null, signingKey);
        });
      },
    });
  }

  validate(payload: any): any {
    if (!payload.sub) {
      throw new UnauthorizedException('Invalid token: missing subject');
    }
    return payload;
  }
}