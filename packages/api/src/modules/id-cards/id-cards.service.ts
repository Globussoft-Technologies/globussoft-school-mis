import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { GenerateIdCardDto } from './dto/generate-id-card.dto';

@Injectable()
export class IdCardsService {
  constructor(private prisma: PrismaService) {}

  private generateCardNumber(): string {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 900000) + 100000;
    return `ID-${year}-${num}`;
  }

  async generate(dto: GenerateIdCardDto) {
    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) throw new NotFoundException('User not found');

    const validFrom = new Date();
    const validTo = new Date();
    validTo.setFullYear(validTo.getFullYear() + 1);

    // Ensure unique card number
    let cardNumber = this.generateCardNumber();
    let attempt = 0;
    while (attempt < 5) {
      const exists = await this.prisma.idCard.findUnique({ where: { cardNumber } });
      if (!exists) break;
      cardNumber = this.generateCardNumber();
      attempt++;
    }

    return this.prisma.idCard.create({
      data: {
        userId: dto.userId,
        cardNumber,
        type: dto.type,
        validFrom,
        validTo,
        photoUrl: dto.photoUrl,
      },
    });
  }

  async bulkGenerate(classId: string) {
    const students = await this.prisma.student.findMany({
      where: { classId },
      include: { user: true },
    });

    const results: { userId: string; cardNumber: string; status: string }[] = [];

    for (const student of students) {
      try {
        let cardNumber = this.generateCardNumber();
        let attempt = 0;
        while (attempt < 5) {
          const exists = await this.prisma.idCard.findUnique({ where: { cardNumber } });
          if (!exists) break;
          cardNumber = this.generateCardNumber();
          attempt++;
        }

        const validFrom = new Date();
        const validTo = new Date();
        validTo.setFullYear(validTo.getFullYear() + 1);

        const card = await this.prisma.idCard.create({
          data: {
            userId: student.userId,
            cardNumber,
            type: 'STUDENT',
            validFrom,
            validTo,
          },
        });
        results.push({ userId: student.userId, cardNumber: card.cardNumber, status: 'created' });
      } catch {
        results.push({ userId: student.userId, cardNumber: '', status: 'skipped' });
      }
    }

    return { generated: results.filter((r) => r.status === 'created').length, results };
  }

  async findAll(type?: string, status?: string) {
    return this.prisma.idCard.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(status ? { status } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const card = await this.prisma.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');
    return card;
  }

  async revoke(id: string) {
    const card = await this.prisma.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');
    return this.prisma.idCard.update({ where: { id }, data: { status: 'REVOKED' } });
  }

  async reportLost(id: string) {
    const card = await this.prisma.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');
    return this.prisma.idCard.update({ where: { id }, data: { status: 'LOST' } });
  }

  async getCardData(id: string) {
    const card = await this.prisma.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');

    const user = await this.prisma.user.findUnique({ where: { id: card.userId } });

    // Try to get student details if STUDENT type
    let studentDetails: {
      className?: string;
      bloodGroup?: string;
      parentName?: string;
      emergencyContact?: string;
      admissionNo?: string;
    } = {};

    if (card.type === 'STUDENT' && user) {
      const student = await this.prisma.student.findFirst({
        where: { userId: user.id },
        include: {
          class: true,
          section: true,
          guardians: { take: 1 },
        },
      });
      if (student) {
        const guardian = (student as any).guardians?.[0];
        studentDetails = {
          className: (student as any).class?.name,
          bloodGroup: (student as any).bloodGroup,
          parentName: guardian?.name,
          emergencyContact: guardian?.phone,
          admissionNo: (student as any).admissionNo,
        };
      }
    }

    const school = await this.prisma.school.findFirst();

    return {
      card: {
        id: card.id,
        cardNumber: card.cardNumber,
        type: card.type,
        status: card.status,
        validFrom: card.validFrom,
        validTo: card.validTo,
        photoUrl: card.photoUrl,
      },
      holder: {
        name: user ? `${user.firstName} ${user.lastName}`.trim() : 'Unknown',
        email: user?.email,
        phone: user?.phone,
        ...studentDetails,
      },
      school: {
        name: school?.name ?? 'MIS-ILSMS School',
        address: school?.address,
        phone: school?.phone,
        email: school?.email,
      },
      qrData: `IDCARD:${card.cardNumber}:${card.userId}`,
    };
  }

  async markPrinted(id: string) {
    const card = await this.prisma.idCard.findUnique({ where: { id } });
    if (!card) throw new NotFoundException('ID card not found');
    const [cardData, _updated] = await Promise.all([
      this.getCardData(id),
      this.prisma.idCard.update({ where: { id }, data: { printedAt: new Date() } }),
    ]);
    return cardData;
  }
}
