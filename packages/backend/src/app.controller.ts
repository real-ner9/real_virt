import { Controller, Get, Inject } from '@nestjs/common';
import { type AppServiceInterface, appServiceName } from './app.service';

@Controller()
export class AppController {
  constructor(
    @Inject(appServiceName) private readonly appService: AppServiceInterface,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHelloWorld();
  }
}
