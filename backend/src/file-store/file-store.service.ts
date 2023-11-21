import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { PutObjectCommandInput, S3 } from '@aws-sdk/client-s3';
import * as process from 'process';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FileStore } from './schemas/file-store.entity';
import { AttachmentStatus } from './types/attachment-status';
import * as sharp from 'sharp';

@Injectable()
export class FileStoreService {
  private readonly s3: S3;
  private readonly logger = new Logger(FileStoreService.name);

  constructor(
    @InjectRepository(FileStore)
    private readonly fileStoreRepository: Repository<FileStore>,
  ) {
    this.s3 = new S3({
      credentials: {
        accessKeyId: process.env.S3_ACCESSKEY_ID,
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      },

      // The transformation for endpoint is not implemented.
      // Refer to UPGRADING.md on aws-sdk-js-v3 for changes needed.
      // Please create/upvote feature request on aws-sdk-js-codemod for endpoint.
      endpoint: process.env.S3_ROOT_URL,

      // The key s3ForcePathStyle is renamed to forcePathStyle.
      forcePathStyle: true,

      region: 'ru-1',

      // The key apiVersion is no longer supported in v3, and can be removed.
      // @deprecated The client uses the "latest" apiVersion.
      apiVersion: 'latest',
    });
  }

  async uploadToS3(
    fileBuffer: Buffer,
    userId: string | number,
  ): Promise<string> {
    userId = `${userId}`;
    try {
      const currentDate = new Date().toISOString();
      const hashName = createHash('md5')
        .update(fileBuffer)
        .update(currentDate)
        .digest('hex');

      // Сжимаем изображение с помощью sharp. Можно настроить размер и качество.
      const compressedImageBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 1080 }) // Задаем ширину, высота будет пропорциональна
        .jpeg({ quality: 80 }) // Выбираем формат JPEG и качество 80%
        .toBuffer();

      const params: PutObjectCommandInput = {
        Bucket: process.env.S3_BUCKET,
        Key: `${hashName}`,
        Body: compressedImageBuffer, // Используем сжатый буфер
        ContentType: 'image/jpeg',
        ACL: 'public-read',
      };
      const res = await this.s3.putObject(params);
      this.logger.log(`File uploaded successfully. ${res.ETag}`);
      const fileRecord = new FileStore(
        userId,
        hashName,
        AttachmentStatus.INITIAL,
      );
      await this.fileStoreRepository.save(fileRecord);
      return hashName;
    } catch (error) {
      this.logger.error(`Error uploading file. ${error}`);
      throw error;
    }
  }

  async deleteFromS3(id: string): Promise<void> {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Key: id,
    };

    try {
      await this.s3.deleteObject(params);
      await this.fileStoreRepository.delete({ fileHash: id });
      this.logger.log(`File deleted successfully.`);
    } catch (error) {
      this.logger.error(`Error deleting file. ${error}`);
      throw error;
    }
  }

  async deleteMultipleFromS3(ids: string[]): Promise<void> {
    const params = {
      Bucket: process.env.S3_BUCKET,
      Delete: {
        Objects: ids.map((id) => ({ Key: id })),
        Quiet: false,
      },
    };

    try {
      const res = await this.s3.deleteObjects(params);
      this.logger.log(
        `Files deleted successfully. ${res.Deleted.length} items removed.`,
      );

      await this.fileStoreRepository.delete(ids.map((id) => id));
      if (res.Errors && res.Errors.length > 0) {
        this.logger.error(`Some objects could not be deleted:`, res.Errors);
      }
    } catch (error) {
      this.logger.error(`Error deleting files. ${error}`);
      throw error;
    }
  }

  async checkOwnership(
    userId: string | number,
    fileHash: string,
  ): Promise<boolean> {
    userId = `${userId}`;
    try {
      const fileRecord = await this.fileStoreRepository.findOne({
        where: {
          fileHash: fileHash,
        },
      });

      // на случай если фотографии нет в file-store
      // это актуально для предыдущей реализации
      if (!fileRecord) return true;

      // Возвращаем true, если запись найдена (т.е. файл принадлежит пользователю)
      return fileRecord.userId === userId;
    } catch (error) {
      this.logger.error(`Error checking file ownership. ${error}`);
      throw error;
    }
  }

  async removeUnusedImages(userId: string | number): Promise<void> {
    userId = `${userId}`; // Преобразуем userId в строку, если это необходимо
    try {
      // Найти все картинки со статусом INITIAL для данного пользователя
      const unusedImages = await this.fileStoreRepository.find({
        where: {
          userId: userId,
          status: AttachmentStatus.INITIAL,
        },
      });

      for (const key of unusedImages) {
        await this.deleteFromS3(key.fileHash);
      }
      // TODO Нужно разобраться как удалять пачками
      // // Собираем ключи для удаления из S3
      // const keysToDelete = unusedImages.map((image) => ({
      //   Key: image.fileHash,
      // }));

      // if (keysToDelete.length > 0) {
      //   // Удаляем найденные картинки из S3
      //   const deleteParams: DeleteObjectsCommandInput = {
      //     Bucket: process.env.S3_BUCKET,
      //     Delete: {
      //       Objects: keysToDelete,
      //       Quiet: false,
      //     },
      //   };
      //
      //   console.log(deleteParams.Delete.Objects);
      //   // const deleteObjectsCommand = new DeleteObjectsCommandIn(deleteParams);
      //   const res = await this.s3.deleteObjects(deleteParams);
      //   this.logger.log(
      //     `Files deleted successfully from S3. ${res.Deleted.length} items removed.`,
      //   );
      //
      //   if (res.Errors && res.Errors.length > 0) {
      //     this.logger.error(
      //       `Some objects could not be deleted from S3:`,
      //       res.Errors,
      //     );
      //   }
      //
      //   // Удаляем найденные картинки из базы данных
      //   for (const image of unusedImages) {
      //     await this.fileStoreRepository.remove(image);
      //   }
      // } else {
      //   this.logger.log(`No unused images with status INITIAL to remove.`);
      // }
    } catch (error) {
      this.logger.error(`Error removing unused images. ${error}`);
      throw error;
    }
  }

  async updateFileStatus(fileId: string, status: AttachmentStatus) {
    return await this.fileStoreRepository.update(
      { fileHash: fileId },
      { status: status },
    );
  }
}
