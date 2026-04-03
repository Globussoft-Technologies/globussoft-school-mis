import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TeachingService {
  constructor(private prisma: PrismaService) {}

  async startSession(
    teacherId: string,
    data: { moduleId: string; classId: string; sectionId?: string },
  ) {
    // Check module exists
    const module = await this.prisma.courseModule.findUnique({
      where: { id: data.moduleId },
    });
    if (!module) throw new NotFoundException('Course module not found');

    // Check no active session for same module + teacher + class
    const existing = await this.prisma.teachingSession.findFirst({
      where: {
        moduleId: data.moduleId,
        teacherId,
        classId: data.classId,
        status: { in: ['IN_PROGRESS', 'PAUSED'] },
      },
    });
    if (existing) {
      throw new ConflictException(
        'An active session already exists for this module and class',
      );
    }

    return this.prisma.teachingSession.create({
      data: {
        moduleId: data.moduleId,
        teacherId,
        classId: data.classId,
        sectionId: data.sectionId,
        daysToComplete: module.daysToComplete ?? 7,
        status: 'IN_PROGRESS',
      },
    });
  }

  async completeSession(id: string, teacherId: string, remarks?: string) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId)
      throw new BadRequestException('Not your session');

    const now = new Date();
    const startDate = new Date(session.startedAt);
    const diffMs = now.getTime() - startDate.getTime();
    const actualDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

    return this.prisma.teachingSession.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: now,
        actualDays,
        remarks,
      },
    });
  }

  async pauseSession(id: string, teacherId: string) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId)
      throw new BadRequestException('Not your session');
    if (session.status !== 'IN_PROGRESS')
      throw new BadRequestException('Session is not in progress');

    return this.prisma.teachingSession.update({
      where: { id },
      data: { status: 'PAUSED' },
    });
  }

  async resumeSession(id: string, teacherId: string) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId)
      throw new BadRequestException('Not your session');
    if (session.status !== 'PAUSED')
      throw new BadRequestException('Session is not paused');

    return this.prisma.teachingSession.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });
  }

  async coverItem(
    sessionId: string,
    teacherId: string,
    data: {
      moduleItemId: string;
      method?: string;
      duration?: number;
      notes?: string;
    },
  ) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id: sessionId },
    });
    if (!session) throw new NotFoundException('Session not found');
    if (session.teacherId !== teacherId)
      throw new BadRequestException('Not your session');
    if (session.status !== 'IN_PROGRESS')
      throw new BadRequestException('Session is not in progress');

    // Verify module item belongs to the session's module
    const item = await this.prisma.courseModuleItem.findUnique({
      where: { id: data.moduleItemId },
    });
    if (!item) throw new NotFoundException('Module item not found');
    if (item.moduleId !== session.moduleId)
      throw new BadRequestException(
        'Item does not belong to this session module',
      );

    // Upsert the coverage log
    const log = await this.prisma.topicCoverageLog.upsert({
      where: {
        sessionId_moduleItemId: {
          sessionId,
          moduleItemId: data.moduleItemId,
        },
      },
      create: {
        sessionId,
        moduleItemId: data.moduleItemId,
        teacherId,
        method: data.method,
        duration: data.duration,
        notes: data.notes,
      },
      update: {
        method: data.method,
        duration: data.duration,
        notes: data.notes,
        coveredAt: new Date(),
      },
    });

    return log;
  }

  async listSessions(
    teacherId: string,
    filters: { classId?: string; status?: string },
  ) {
    const where: any = { teacherId };
    if (filters.classId) where.classId = filters.classId;
    if (filters.status) where.status = filters.status;

    const sessions = await this.prisma.teachingSession.findMany({
      where,
      orderBy: { startedAt: 'desc' },
      include: {
        coverageLogs: true,
      },
    });

    // Enrich with module info
    const moduleIds = [...new Set(sessions.map((s) => s.moduleId))];
    const modules = await this.prisma.courseModule.findMany({
      where: { id: { in: moduleIds } },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    const moduleMap = new Map(modules.map((m) => [m.id, m]));

    return sessions.map((s) => {
      const mod = moduleMap.get(s.moduleId);
      return {
        ...s,
        module: mod
          ? {
              id: mod.id,
              title: mod.title,
              description: mod.description,
              itemCount: mod.items.length,
              classId: mod.classId,
              subjectId: mod.subjectId,
            }
          : null,
        coveredCount: s.coverageLogs.length,
        totalItems: mod?.items.length ?? 0,
      };
    });
  }

  async getSessionDetail(id: string) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id },
      include: { coverageLogs: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const module = await this.prisma.courseModule.findUnique({
      where: { id: session.moduleId },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });

    const coveredMap = new Map(
      session.coverageLogs.map((log) => [log.moduleItemId, log]),
    );

    const items =
      module?.items.map((item) => ({
        ...item,
        covered: coveredMap.has(item.id),
        coverageLog: coveredMap.get(item.id) || null,
      })) ?? [];

    return {
      ...session,
      module: module
        ? { id: module.id, title: module.title, description: module.description }
        : null,
      items,
      coveredCount: session.coverageLogs.length,
      totalItems: module?.items.length ?? 0,
    };
  }

  async getSessionProgress(id: string) {
    const session = await this.prisma.teachingSession.findUnique({
      where: { id },
      include: { coverageLogs: true },
    });
    if (!session) throw new NotFoundException('Session not found');

    const module = await this.prisma.courseModule.findUnique({
      where: { id: session.moduleId },
      include: { items: true },
    });

    const totalItems = module?.items.length ?? 0;
    const coveredItems = session.coverageLogs.length;
    const percentage =
      totalItems > 0 ? Math.round((coveredItems / totalItems) * 100) : 0;

    return {
      sessionId: id,
      moduleId: session.moduleId,
      totalItems,
      coveredItems,
      percentage,
      status: session.status,
      startedAt: session.startedAt,
      daysToComplete: session.daysToComplete,
    };
  }

  async getDashboard(teacherId: string) {
    const sessions = await this.prisma.teachingSession.findMany({
      where: { teacherId },
      include: { coverageLogs: true },
    });

    const inProgress = sessions.filter((s) => s.status === 'IN_PROGRESS');
    const completed = sessions.filter((s) => s.status === 'COMPLETED');
    const paused = sessions.filter((s) => s.status === 'PAUSED');

    // Get module details for active sessions
    const activeModuleIds = inProgress.map((s) => s.moduleId);
    const activeModules = await this.prisma.courseModule.findMany({
      where: { id: { in: activeModuleIds } },
      include: { items: true },
    });
    const moduleMap = new Map(activeModules.map((m) => [m.id, m]));

    const activeSessions = inProgress.map((s) => {
      const mod = moduleMap.get(s.moduleId);
      const totalItems = mod?.items.length ?? 0;
      const coveredItems = s.coverageLogs.length;
      return {
        id: s.id,
        moduleTitle: mod?.title ?? 'Unknown',
        classId: s.classId,
        sectionId: s.sectionId,
        totalItems,
        coveredItems,
        percentage:
          totalItems > 0
            ? Math.round((coveredItems / totalItems) * 100)
            : 0,
        startedAt: s.startedAt,
        daysToComplete: s.daysToComplete,
      };
    });

    // Average completion time for completed sessions
    const avgDays =
      completed.length > 0
        ? Math.round(
            completed.reduce((sum, s) => sum + (s.actualDays ?? 0), 0) /
              completed.length,
          )
        : 0;

    // Total items covered across all sessions
    const totalItemsCovered = sessions.reduce(
      (sum, s) => sum + s.coverageLogs.length,
      0,
    );

    return {
      totalSessions: sessions.length,
      inProgressCount: inProgress.length,
      completedCount: completed.length,
      pausedCount: paused.length,
      averageCompletionDays: avgDays,
      totalItemsCovered,
      activeSessions,
    };
  }
}
