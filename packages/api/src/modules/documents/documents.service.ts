import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDocumentDto } from './dto/create-document.dto';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateDocumentDto, uploadedBy: string) {
    return this.prisma.studentDocument.create({
      data: {
        studentId: dto.studentId,
        type: dto.type,
        fileName: dto.fileName,
        fileUrl: dto.fileUrl,
        uploadedBy,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        notes: dto.notes,
      },
    });
  }

  async findAll(studentId?: string) {
    return this.prisma.studentDocument.findMany({
      where: {
        ...(studentId ? { studentId } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const doc = await this.prisma.studentDocument.findUnique({ where: { id } });
    if (!doc) throw new NotFoundException('Document not found');
    return doc;
  }

  async verify(id: string, verifiedBy: string, notes?: string) {
    await this.findOne(id);
    return this.prisma.studentDocument.update({
      where: { id },
      data: {
        verified: true,
        verifiedBy,
        verifiedAt: new Date(),
        ...(notes !== undefined ? { notes } : {}),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.studentDocument.delete({ where: { id } });
  }

  async getChecklist(studentId: string) {
    const requiredTypes = [
      'BIRTH_CERTIFICATE',
      'TRANSFER_CERTIFICATE',
      'AADHAAR',
      'PHOTO',
      'MEDICAL',
      'REPORT_CARD',
      'CONSENT_FORM',
      'ADDRESS_PROOF',
    ];

    const docs = await this.prisma.studentDocument.findMany({
      where: { studentId },
    });

    const submitted = new Map(docs.map((d) => [d.type, d]));

    return requiredTypes.map((type) => {
      const doc = submitted.get(type);
      return {
        type,
        status: doc ? (doc.verified ? 'VERIFIED' : 'SUBMITTED') : 'PENDING',
        document: doc || null,
      };
    });
  }
}
