import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { RoomsModule } from './rooms/rooms.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb+srv://Cluster84278:WlhFQmdzQ2do@cluster84278.zywqkmq.mongodb.net/?appName=mongosh+1.10.5',
    ),
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
