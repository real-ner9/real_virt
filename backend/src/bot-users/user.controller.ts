import { Controller, Get } from '@nestjs/common';

@Controller('user')
export class UserController {
  @Get('authorize')
  async authorize(res) {
    return JSON.stringify({ a: 'ты лох' });
  }
}
