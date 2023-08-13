import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService, appServiceName } from './app.service';

@Module({
  imports: [],
  controllers: [AppController],
  providers: [
    {
      provide: appServiceName,
      useClass: AppService,
    },
  ],
})
export class AppModule {}
