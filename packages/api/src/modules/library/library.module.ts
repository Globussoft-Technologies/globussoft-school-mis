import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService],
  exports: [LibraryService],
})
export class LibraryModule {}
