import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class LibraryService {
  constructor(private prisma: PrismaService) {}

  async createBook(data: {
    title: string;
    author: string;
    isbn?: string;
    category: string;
    publisher?: string;
    publicationYear?: number;
    totalCopies?: number;
    location?: string;
    schoolId: string;
  }) {
    const copies = data.totalCopies ?? 1;
    return this.prisma.libraryBook.create({
      data: {
        ...data,
        totalCopies: copies,
        availableCopies: copies,
      },
    });
  }

  async findAllBooks(params: { search?: string; category?: string; schoolId?: string }) {
    const { search, category, schoolId } = params;
    return this.prisma.libraryBook.findMany({
      where: {
        ...(schoolId ? { schoolId } : {}),
        ...(category ? { category } : {}),
        ...(search
          ? {
              OR: [
                { title: { contains: search } },
                { author: { contains: search } },
                { isbn: { contains: search } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { issues: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findBookById(id: string) {
    const book = await this.prisma.libraryBook.findUnique({
      where: { id },
      include: {
        issues: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
      },
    });
    if (!book) throw new NotFoundException('Book not found');
    return book;
  }

  async issueBook(data: {
    bookId: string;
    borrowerId: string;
    dueDate: string;
    remarks?: string;
  }) {
    const book = await this.prisma.libraryBook.findUnique({ where: { id: data.bookId } });
    if (!book) throw new NotFoundException('Book not found');
    if (book.availableCopies < 1) throw new BadRequestException('No copies available');

    const [issue] = await this.prisma.$transaction([
      this.prisma.libraryIssue.create({
        data: {
          bookId: data.bookId,
          borrowerId: data.borrowerId,
          issueDate: new Date(),
          dueDate: new Date(data.dueDate),
          status: 'ISSUED',
          remarks: data.remarks,
        },
        include: { book: true },
      }),
      this.prisma.libraryBook.update({
        where: { id: data.bookId },
        data: { availableCopies: { decrement: 1 } },
      }),
    ]);
    return issue;
  }

  async returnBook(issueId: string, remarks?: string) {
    const issue = await this.prisma.libraryIssue.findUnique({
      where: { id: issueId },
      include: { book: true },
    });
    if (!issue) throw new NotFoundException('Issue record not found');
    if (issue.status === 'RETURNED') throw new BadRequestException('Book already returned');

    const today = new Date();
    const dueDate = new Date(issue.dueDate);
    let fine: number | null = null;
    if (today > dueDate) {
      const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      fine = daysOverdue * 2; // Rs 2 per day
    }

    const [updated] = await this.prisma.$transaction([
      this.prisma.libraryIssue.update({
        where: { id: issueId },
        data: {
          returnDate: today,
          status: 'RETURNED',
          fine,
          remarks: remarks || issue.remarks,
        },
        include: { book: true },
      }),
      this.prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: { increment: 1 } },
      }),
    ]);
    return updated;
  }

  async getOverdue() {
    const today = new Date();
    // Mark overdue
    await this.prisma.libraryIssue.updateMany({
      where: {
        status: 'ISSUED',
        dueDate: { lt: today },
      },
      data: { status: 'OVERDUE' },
    });

    return this.prisma.libraryIssue.findMany({
      where: { status: 'OVERDUE' },
      include: { book: true },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getBorrowerHistory(userId: string) {
    return this.prisma.libraryIssue.findMany({
      where: { borrowerId: userId },
      include: { book: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async searchBooks(query: string) {
    return this.prisma.libraryBook.findMany({
      where: {
        OR: [
          { title: { contains: query } },
          { author: { contains: query } },
          { isbn: { contains: query } },
        ],
      },
      take: 10,
    });
  }
}
