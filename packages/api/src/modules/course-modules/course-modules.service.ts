import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CourseModulesService {
  constructor(private prisma: PrismaService) {}

  async createModule(data: {
    title: string;
    description?: string;
    classId: string;
    subjectId: string;
    orderIndex?: number;
    unlockType?: string;
    unlockDate?: string;
    prerequisiteModuleId?: string;
    completionCriteria?: string;
    minimumScore?: number;
    estimatedMinutes?: number;
    createdBy: string;
    items?: Array<{
      title: string;
      type: string;
      contentId?: string;
      contentUrl?: string;
      description?: string;
      orderIndex: number;
      isRequired?: boolean;
      estimatedMinutes?: number;
    }>;
  }) {
    // Auto-calculate orderIndex if not provided
    if (data.orderIndex === undefined) {
      const count = await this.prisma.courseModule.count({
        where: { classId: data.classId, subjectId: data.subjectId },
      });
      data.orderIndex = count + 1;
    }

    const module = await this.prisma.courseModule.create({
      data: {
        title: data.title,
        description: data.description,
        classId: data.classId,
        subjectId: data.subjectId,
        orderIndex: data.orderIndex,
        unlockType: data.unlockType ?? 'ALWAYS',
        unlockDate: data.unlockDate ? new Date(data.unlockDate) : undefined,
        prerequisiteModuleId: data.prerequisiteModuleId,
        completionCriteria: data.completionCriteria ?? 'VIEW_ALL',
        minimumScore: data.minimumScore,
        estimatedMinutes: data.estimatedMinutes,
        createdBy: data.createdBy,
        items: data.items?.length
          ? {
              create: data.items.map((item) => ({
                title: item.title,
                type: item.type,
                contentId: item.contentId,
                contentUrl: item.contentUrl,
                description: item.description,
                orderIndex: item.orderIndex,
                isRequired: item.isRequired ?? true,
                estimatedMinutes: item.estimatedMinutes,
              })),
            }
          : undefined,
      },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
    return module;
  }

  async getModulesBySubject(classId: string, subjectId: string, studentId?: string) {
    const modules = await this.prisma.courseModule.findMany({
      where: { classId, subjectId },
      orderBy: { orderIndex: 'asc' },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            completions: studentId
              ? { where: { studentId } }
              : false,
          },
        },
      },
    });

    return modules.map((mod) => {
      const totalItems = mod.items.length;
      const completedItems = studentId
        ? mod.items.filter((item) =>
            (item.completions as any[]).some((c) => c.status === 'COMPLETED'),
          ).length
        : 0;
      return {
        ...mod,
        completionStats: {
          total: totalItems,
          completed: completedItems,
          percentage: totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0,
        },
      };
    });
  }

  async getModuleDetail(moduleId: string, studentId?: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: {
        items: {
          orderBy: { orderIndex: 'asc' },
          include: {
            completions: studentId
              ? { where: { studentId } }
              : false,
          },
        },
      },
    });
    if (!module) throw new NotFoundException('Module not found');

    let unlockStatus = null;
    if (studentId) {
      unlockStatus = await this.checkUnlockStatus(moduleId, studentId);
    }

    return { ...module, unlockStatus };
  }

  async checkUnlockStatus(moduleId: string, studentId: string) {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
    });
    if (!module) throw new NotFoundException('Module not found');

    if (module.unlockType === 'ALWAYS') {
      return { unlocked: true, reason: 'Always available' };
    }

    if (module.unlockType === 'DATE') {
      if (!module.unlockDate) return { unlocked: true, reason: 'No date set' };
      const now = new Date();
      if (now >= module.unlockDate) {
        return { unlocked: true, reason: 'Date reached' };
      }
      return { unlocked: false, reason: `Unlocks on ${module.unlockDate.toISOString()}` };
    }

    if (module.unlockType === 'SEQUENTIAL') {
      // Find the previous module (orderIndex - 1)
      const prevModule = await this.prisma.courseModule.findFirst({
        where: {
          classId: module.classId,
          subjectId: module.subjectId,
          orderIndex: module.orderIndex - 1,
        },
        include: { items: true },
      });
      if (!prevModule) return { unlocked: true, reason: 'First module' };
      const prevCompleted = await this.isModuleCompleted(prevModule.id, studentId);
      if (prevCompleted) return { unlocked: true, reason: 'Previous module completed' };
      return { unlocked: false, reason: 'Complete previous module first' };
    }

    if (module.unlockType === 'PREREQUISITE') {
      if (!module.prerequisiteModuleId) return { unlocked: true, reason: 'No prerequisite set' };
      const prereqCompleted = await this.isModuleCompleted(module.prerequisiteModuleId, studentId);
      if (prereqCompleted) return { unlocked: true, reason: 'Prerequisite completed' };
      return { unlocked: false, reason: 'Complete prerequisite module first' };
    }

    return { unlocked: true, reason: 'Default' };
  }

  private async isModuleCompleted(moduleId: string, studentId: string): Promise<boolean> {
    const module = await this.prisma.courseModule.findUnique({
      where: { id: moduleId },
      include: { items: { where: { isRequired: true } } },
    });
    if (!module) return false;

    const requiredItems = module.items;
    if (requiredItems.length === 0) return true;

    if (module.completionCriteria === 'MANUAL') {
      // Check if manually marked - we use a completion of all items
      const completions = await this.prisma.moduleItemCompletion.count({
        where: { itemId: { in: requiredItems.map((i) => i.id) }, studentId, status: 'COMPLETED' },
      });
      return completions === requiredItems.length;
    }

    if (module.completionCriteria === 'SCORE_MINIMUM') {
      const completions = await this.prisma.moduleItemCompletion.findMany({
        where: { itemId: { in: requiredItems.map((i) => i.id) }, studentId, status: 'COMPLETED' },
      });
      if (completions.length < requiredItems.length) return false;
      if (module.minimumScore) {
        const scores = completions.map((c) => c.score ?? 0);
        const avg = scores.reduce((a, b) => a + b, 0) / scores.length;
        return avg >= module.minimumScore;
      }
      return true;
    }

    // VIEW_ALL
    const completions = await this.prisma.moduleItemCompletion.count({
      where: { itemId: { in: requiredItems.map((i) => i.id) }, studentId, status: 'COMPLETED' },
    });
    return completions === requiredItems.length;
  }

  async addItemToModule(
    moduleId: string,
    data: {
      title: string;
      type: string;
      contentId?: string;
      contentUrl?: string;
      description?: string;
      isRequired?: boolean;
      estimatedMinutes?: number;
    },
  ) {
    const count = await this.prisma.courseModuleItem.count({ where: { moduleId } });
    return this.prisma.courseModuleItem.create({
      data: {
        moduleId,
        title: data.title,
        type: data.type,
        contentId: data.contentId,
        contentUrl: data.contentUrl,
        description: data.description,
        orderIndex: count + 1,
        isRequired: data.isRequired ?? true,
        estimatedMinutes: data.estimatedMinutes,
      },
    });
  }

  async completeItem(itemId: string, studentId: string, score?: number) {
    const item = await this.prisma.courseModuleItem.findUnique({
      where: { id: itemId },
      include: { module: true },
    });
    if (!item) throw new NotFoundException('Item not found');

    const completion = await this.prisma.moduleItemCompletion.upsert({
      where: { itemId_studentId: { itemId, studentId } },
      create: {
        itemId,
        studentId,
        status: 'COMPLETED',
        score,
        completedAt: new Date(),
      },
      update: {
        status: 'COMPLETED',
        score,
        completedAt: new Date(),
      },
    });

    // Check if module is now complete
    const moduleComplete = await this.isModuleCompleted(item.moduleId, studentId);
    return { completion, moduleComplete };
  }

  async getStudentProgress(studentId: string, classId: string, subjectId?: string) {
    const modules = await this.prisma.courseModule.findMany({
      where: { classId, ...(subjectId && { subjectId }), isPublished: true },
      include: { items: { where: { isRequired: true } } },
    });

    const results = await Promise.all(
      modules.map(async (mod) => {
        const completed = await this.isModuleCompleted(mod.id, studentId);
        const itemCompletions = await this.prisma.moduleItemCompletion.count({
          where: {
            itemId: { in: mod.items.map((i) => i.id) },
            studentId,
            status: 'COMPLETED',
          },
        });
        return {
          moduleId: mod.id,
          title: mod.title,
          subjectId: mod.subjectId,
          orderIndex: mod.orderIndex,
          totalItems: mod.items.length,
          completedItems: itemCompletions,
          isComplete: completed,
        };
      }),
    );

    const totalModules = results.length;
    const completedModules = results.filter((r) => r.isComplete).length;

    return {
      studentId,
      classId,
      subjectId,
      totalModules,
      completedModules,
      overallPercentage:
        totalModules > 0 ? Math.round((completedModules / totalModules) * 100) : 0,
      modules: results,
    };
  }

  async reorderModules(classId: string, subjectId: string, moduleIds: string[]) {
    await Promise.all(
      moduleIds.map((id, index) =>
        this.prisma.courseModule.update({
          where: { id },
          data: { orderIndex: index + 1 },
        }),
      ),
    );
    return this.getModulesBySubject(classId, subjectId);
  }

  async publishModule(moduleId: string, isPublished: boolean) {
    const module = await this.prisma.courseModule.findUnique({ where: { id: moduleId } });
    if (!module) throw new NotFoundException('Module not found');
    return this.prisma.courseModule.update({
      where: { id: moduleId },
      data: { isPublished },
      include: { items: { orderBy: { orderIndex: 'asc' } } },
    });
  }
}
