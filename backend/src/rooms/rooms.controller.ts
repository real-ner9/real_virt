import {
  Controller,
  Post,
  Param,
  Get,
  Body,
  Delete,
  NotFoundException,
  InternalServerErrorException,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { Room } from './schemas/room.schema';
import { catchError, Observable, of } from 'rxjs';
import { SearchDto } from './models/search-dto';
import { FileInterceptor } from '@nestjs/platform-express';
import * as multer from 'multer';
import { createHash } from 'crypto';
import { Attachment } from './models/attachment';

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/Users/demo/Documents/frontend/react/virt/backend/file-store');
  },
  filename: (req, file, cb) => {
    // Создаем хэш из имени файла и текущей даты для уникальности
    const hash = createHash('sha256')
      .update(file.originalname + Date.now())
      .digest('hex');
    const extension = file.originalname.split('.').pop(); // Получаем расширение файла
    cb(null, `${hash}.${extension}`);
  },
});
const upload = multer({ storage: storage });

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @Post()
  createRoom(): Observable<Room> {
    return this.roomsService.createRoom();
  }

  @Get(':roomNumber')
  getRoom(@Param('roomNumber') roomNumber: string): Observable<Room> {
    return this.roomsService.getRoomByNumber(roomNumber);
  }

  @Post(':roomNumber/messages')
  addMessage(
    @Param('roomNumber') roomNumber: string,
    @Body('userId') userId: string,
    @Body('content') content: string,
    @Body('attachments') attachments: Attachment[],
  ): Observable<Room> {
    return this.roomsService.addMessageToRoom({
      roomNumber,
      userId,
      content,
      attachments,
    });
  }

  @Delete(':roomNumber')
  deleteRoom(@Param('roomNumber') roomNumber: string): Observable<void> {
    return this.roomsService.deleteRoom(roomNumber).pipe(
      catchError((error) => {
        if (error instanceof NotFoundException) {
          throw error;
        }
        throw new InternalServerErrorException(
          'An error occurred while deleting the room',
        );
      }),
    );
  }

  @Post('search')
  searchForChat(@Body() dto: SearchDto) {
    return this.roomsService.searchForChat(
      dto.userId,
      dto.userParameters,
      dto.searchParameters,
    );
  }

  @Post('stopSearch')
  stopSearch(@Body('userId') userId: string): Observable<void> {
    this.roomsService.stopSearch(userId);
    return of(null);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', { storage: storage }))
  uploadFile(@UploadedFile() file): Observable<any> {
    return of([
      {
        url: `file-store/${file.filename}`,
        fileName: file.filename,
        type: file.mimetype.split('/')[0],
        size: file.size,
      },
    ]);
  }
}
