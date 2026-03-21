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
import { DiscussionsService } from './discussions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Discussions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly service: DiscussionsService) {}

  @Post()
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  createForum(@Body() body: any, @CurrentUser('sub') userId: string) {
    return this.service.createForum({ ...body, createdBy: userId });
  }

  @Get()
  getForums(@Query('classId') classId: string, @Query('subjectId') subjectId?: string) {
    return this.service.getForums(classId, subjectId);
  }

  @Get(':id')
  getForum(@Param('id') id: string) {
    return this.service.getForumById(id);
  }

  @Get(':id/posts')
  getPosts(@Param('id') forumId: string) {
    return this.service.getPosts(forumId);
  }

  @Get(':id/participation')
  getParticipation(@Param('id') forumId: string) {
    return this.service.getForumParticipation(forumId);
  }

  @Get('student/:studentId/activity')
  getStudentActivity(
    @Param('studentId') studentId: string,
    @Query('classId') classId: string,
  ) {
    return this.service.getStudentForumActivity(studentId, classId);
  }

  @Post(':id/posts')
  createPost(
    @Param('id') forumId: string,
    @Body() body: any,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.createPost(forumId, { ...body, authorId: body.authorId || userId });
  }

  @Patch('posts/:id/like')
  likePost(@Param('id') id: string) {
    return this.service.likePost(id);
  }

  @Patch('posts/:id/score')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  scorePost(@Param('id') id: string, @Body('score') score: number) {
    return this.service.scorePost(id, score);
  }

  @Patch('posts/:id/pin')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  pinPost(@Param('id') id: string, @Body('isPinned') isPinned: boolean) {
    return this.service.pinPost(id, isPinned);
  }

  @Patch(':id/lock')
  @Roles('SUPER_ADMIN', 'ACADEMIC_COORDINATOR', 'CLASS_TEACHER', 'SUBJECT_TEACHER')
  lockForum(@Param('id') id: string, @Body('isLocked') isLocked: boolean) {
    return this.service.lockForum(id, isLocked);
  }
}
