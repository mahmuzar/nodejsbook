export interface AuthRequest extends Request {
  user?: JwtPayload;
}

export interface JwtPayload {
  id: number;
  username: string;
  iat: number;
  exp: number;
}