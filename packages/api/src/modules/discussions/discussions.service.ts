import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DiscussionsService {
  constructor(private prisma: PrismaService) {}

  async createForum(data: {
    title: string;
    description?: string;
    classId: string;
    subjectId?: string;
    type?: string;
    allowAnonymous?: boolean;
    totalPoints?: number;
    dueDate?: string;
    createdBy: string;
  }) {
    return this.prisma.discussionForum.create({
      data: {
        title: data.title,
        description: data.description,
        classId: data.classId,
        subjectId: data.subjectId,
        type: data.type ?? 'OPEN',
        allowAnonymous: data.allowAnonymous ?? false,
        totalPoints: data.totalPoints,
        dueDate: data.dueDate ? new Date(data.dueDate) : undefined,
        createdBy: data.createdBy,
      },
    });
  }

  async getForums(classId: string, subjectId?: string) {
    const forums = await this.prisma.discussionForum.findMany({
      where: {
        classId,
        ...(subjectId && { subjectId }),
      },
      include: {
        _count: { select: { posts: true } },
      },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
    });
    return forums;
  }

  async getForumById(forumId: string) {
    const forum = await this.prisma.discussionForum.findUnique({ where: { id: forumId } });
    if (!forum) throw new NotFoundException('Forum not found');
    return forum;
  }

  async createPost(
    forumId: string,
    data: {
      authorId: string;
      content: string;
      parentId?: string;
      isAnonymous?: boolean;
    },
  ) {
    const forum = await this.prisma.discussionForum.findUnique({ where: { id: forumId } });
    if (!forum) throw new NotFoundException('Forum not found');
    if (forum.isLocked) throw new BadRequestException('Forum is locked');

    if (data.parentId) {
      const parent = await this.prisma.discussionPost.findUnique({ where: { id: data.parentId } });
      if (!parent) throw new NotFoundException('Parent post not found');
    }

    return this.prisma.discussionPost.create({
      data: {
        forumId,
        authorId: data.authorId,
        parentId: data.parentId,
        content: data.content,
        isAnonymous: data.isAnonymous ?? false,
      },
    });
  }

  async getPosts(forumId: string) {
    const forum = await this.prisma.discussionForum.findUnique({ where: { id: forumId } });
    if (!forum) throw new NotFoundException('Forum not found');

    // Fetch root posts (no parent)
    const rootPosts = await this.prisma.discussionPost.findMany({
      where: { forumId, parentId: null },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
    });

    // For each root post, fetch replies (1 level deep)
    const postsWithReplies = await Promise.all(
      rootPosts.map(async (post) => {
        const replies = await this.prisma.discussionPost.findMany({
          where: { parentId: post.id },
          orderBy: { createdAt: 'asc' },
        });
        // Fetch second-level replies
        const repliesWithNested = await Promise.all(
          replies.map(async (reply) => {
            const nestedReplies = await this.prisma.discussionPost.findMany({
              where: { parentId: reply.id },
              orderBy: { createdAt: 'asc' },
            });
            return { ...reply, replies: nestedReplies };
          }),
        );
        return { ...post, replies: repliesWithNested };
      }),
    );

    return { forum, posts: postsWithReplies };
  }

  async likePost(postId: string) {
    const post = await this.prisma.discussionPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.discussionPost.update({
      where: { id: postId },
      data: { likes: { increment: 1 } },
    });
  }

  async scorePost(postId: string, score: number) {
    const post = await this.prisma.discussionPost.findUnique({
      where: { id: postId },
      include: { forum: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.forum.type !== 'GRADED') throw new BadRequestException('Forum is not graded');
    return this.prisma.discussionPost.update({ where: { id: postId }, data: { score } });
  }

  async lockForum(forumId: string, isLocked: boolean) {
    const forum = await this.prisma.discussionForum.findUnique({ where: { id: forumId } });
    if (!forum) throw new NotFoundException('Forum not found');
    return this.prisma.discussionForum.update({ where: { id: forumId }, data: { isLocked } });
  }

  async pinPost(postId: string, isPinned: boolean) {
    const post = await this.prisma.discussionPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    return this.prisma.discussionPost.update({ where: { id: postId }, data: { isPinned } });
  }

  async getForumParticipation(forumId: string) {
    const forum = await this.prisma.discussionForum.findUnique({ where: { id: forumId } });
    if (!forum) throw new NotFoundException('Forum not found');

    const posts = await this.prisma.discussionPost.findMany({ where: { forumId } });

    // Count posts per student
    const countMap: Record<string, { authorId: string; postCount: number; replyCount: number; score?: number }> = {};
    for (const post of posts) {
      if (!countMap[post.authorId]) {
        countMap[post.authorId] = { authorId: post.authorId, postCount: 0, replyCount: 0 };
      }
      if (post.parentId) {
        countMap[post.authorId].replyCount += 1;
      } else {
        countMap[post.authorId].postCount += 1;
      }
      if (post.score !== null) {
        countMap[post.authorId].score = post.score ?? undefined;
      }
    }

    return {
      forumId,
      totalPosts: posts.length,
      participants: Object.values(countMap),
    };
  }

  async getStudentForumActivity(studentId: string, classId: string) {
    const forums = await this.prisma.discussionForum.findMany({ where: { classId } });
    const forumIds = forums.map((f) => f.id);
    const posts = await this.prisma.discussionPost.findMany({
      where: { forumId: { in: forumIds }, authorId: studentId },
      orderBy: { createdAt: 'desc' },
    });
    return {
      studentId,
      classId,
      totalForums: forums.length,
      participatedForums: new Set(posts.map((p) => p.forumId)).size,
      totalPosts: posts.filter((p) => !p.parentId).length,
      totalReplies: posts.filter((p) => p.parentId).length,
      posts,
    };
  }
}
