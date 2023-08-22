import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsModule } from './rooms/rooms.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://Cluster84278:WlhFQmdzQ2do@cluster84278.zywqkmq.mongodb.net/?appName=mongosh+1.10.5',
    ),
    RoomsModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'file-store'),
      serveRoot: '/rooms/file-store/',
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
