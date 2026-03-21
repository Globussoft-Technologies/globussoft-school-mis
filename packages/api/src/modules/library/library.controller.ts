import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LibraryService } from './library.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Library')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('library')
export class LibraryController {
  constructor(private libraryService: LibraryService) {}

  @Post('books')
  createBook(@Body() body: any) {
    return this.libraryService.createBook(body);
  }

  @Get('books')
  findAllBooks(
    @Query('search') search?: string,
    @Query('category') category?: string,
    @Query('schoolId') schoolId?: string,
  ) {
    return this.libraryService.findAllBooks({ search, category, schoolId });
  }

  @Get('books/:id')
  findBookById(@Param('id') id: string) {
    return this.libraryService.findBookById(id);
  }

  @Post('issue')
  issueBook(@Body() body: { bookId: string; borrowerId: string; dueDate: string; remarks?: string }) {
    return this.libraryService.issueBook(body);
  }

  @Patch('return/:issueId')
  returnBook(@Param('issueId') issueId: string, @Body() body: { remarks?: string }) {
    return this.libraryService.returnBook(issueId, body.remarks);
  }

  @Get('overdue')
  getOverdue() {
    return this.libraryService.getOverdue();
  }

  @Get('borrower/:userId')
  getBorrowerHistory(@Param('userId') userId: string) {
    return this.libraryService.getBorrowerHistory(userId);
  }
}
