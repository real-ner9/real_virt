import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { checkSignature } from './utils/check-signature';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) {
      res.status(401).json({ reason: 'Authorization header is missing' });
      return;
    }
    const check = checkSignature(authHeader, process.env.BOT_TOKEN);
    if (!check) {
      res.status(401).json({ reason: 'Invalid authorization data' });
      return;
    }
    next();
  }
}
