import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Query,
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
      console.log('authString', authString);
      console.log('this.getUser(authString)', this.getUser(authString));
      const { id } = this.getUser(authString);
      await this.userService.setLastLoginTimestamp(id);
      return JSON.stringify({ status: 'COMPLETE' });
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('matches')
  async getMatches(@Req() req: Request) {
    try {
      const authString = req.headers['authorization'];
      const { id } = this.getUser(authString);
      return await this.userService.getMatches(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('requests')
  async getRequests(@Req() req: Request) {
    try {
      const authString = req.headers['authorization'];
      const { id } = this.getUser(authString);
      return await this.userService.getRequests(id);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('feed')
  async getFeed(
    @Req() req: Request,
    @Query('pageSize') pageSize: number = 10,
    @Query('pageNumber') pageNumber: number = 1,
  ) {
    try {
      const authString = req.headers['authorization'];
      const { id } = this.getUser(authString);
      return await this.userService.getFeed(id, pageSize, pageNumber);
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Get('liked-me')
  async getUsersWhoLikedMe(
    @Req() req: Request,
    @Query('pageSize') pageSize: number = 10,
    @Query('pageNumber') pageNumber: number = 1,
  ) {
    try {
      const authString = req.headers['authorization'];
      const { id } = this.getUser(authString);
      return await this.userService.getUsersWhoLikedMe(
        id,
        pageSize,
        pageNumber,
      );
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  getUser(authString: string): TgUser | null {
    const actualDataString = authString.replace('twa-init-data ', '');
    const data = new URLSearchParams(actualDataString);

    const userData = data.get('user');

    console.log('userdata', userData);
    return userData ? JSON.parse(userData) : null;
  }
}
