import { Module } from '@nestjs/common';
import { GalleryService } from './gallery.service';
import { GalleryController } from './gallery.controller';

@Module({
  controllers: [GalleryController],
  providers: [GalleryService],
  exports: [GalleryService],
})
export class GalleryModule {}
