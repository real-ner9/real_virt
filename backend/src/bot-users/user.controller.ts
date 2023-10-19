import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { TgUser } from './types/tg-user';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}
  @Get('authorize')
  async authorize(@Req() req: Request) {
    try {
      const authString = req.headers['authorization'];
      const user = this.getUser(authString);

      console.log(user);
      return JSON.stringify({ status: 'COMPLETE' });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getUser(authString: string): TgUser | null {
    const data = new URLSearchParams(authString);
    const userData = data.get('user');

    return userData ? JSON.parse(userData) : null;
  }
}
