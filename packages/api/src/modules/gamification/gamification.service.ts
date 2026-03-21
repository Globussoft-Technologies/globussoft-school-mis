import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function calculateLevel(totalPoints: number): number {
  return Math.floor(totalPoints / 100) + 1;
}

function getLevelTitle(level: number): string {
  if (level === 1) return 'Beginner';
  if (level <= 3) return 'Explorer';
  if (level <= 5) return 'Scholar';
  if (level <= 8) return 'Expert';
  return 'Master';
}

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(
    studentId: string,
    points: number,
    category: string,
    reason?: string,
    awardedBy?: string,
  ) {
    // Get all points to calculate total
    const allPoints = await this.prisma.studentPoints.aggregate({
      where: { studentId },
      _sum: { points: true },
    });
    const totalBefore = allPoints._sum.points ?? 0;
    const totalAfter = totalBefore + points;
    const newLevel = calculateLevel(totalAfter);

    const pointRecord = await this.prisma.studentPoints.create({
      data: {
        studentId,
        points,
        level: newLevel,
        category,
        reason,
        awardedBy,
      },
    });

    // Update leaderboard for all classes this student is in
    await this.recalculateStudentLeaderboards(studentId, totalAfter, newLevel);

    return {
      pointRecord,
      totalPoints: totalAfter,
      level: newLevel,
      levelTitle: getLevelTitle(newLevel),
      leveledUp: newLevel > calculateLevel(totalBefore),
    };
  }

  private async recalculateStudentLeaderboards(studentId: string, totalPoints: number, level: number) {
    const leaderboards = await this.prisma.leaderboard.findMany({ where: { studentId } });
    await Promise.all(
      leaderboards.map((lb) =>
        this.prisma.leaderboard.update({
          where: { id: lb.id },
          data: { totalPoints, level },
        }),
      ),
    );
  }

  async awardBadge(studentId: string, badgeId: string, reason?: string, awardedBy?: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id: badgeId } });
    if (!badge) throw new NotFoundException('Badge not found');

    const existing = await this.prisma.badgeAward.findUnique({
      where: { badgeId_studentId: { badgeId, studentId } },
    });
    if (existing) throw new ConflictException('Badge already awarded to this student');

    const award = await this.prisma.badgeAward.create({
      data: { badgeId, studentId, reason, awardedBy },
      include: { badge: true },
    });

    // Award badge points
    if (badge.pointsValue > 0) {
      await this.awardPoints(studentId, badge.pointsValue, 'EXTRA_CREDIT', `Badge: ${badge.name}`, awardedBy);
    }

    // Update badge count on leaderboard
    const leaderboards = await this.prisma.leaderboard.findMany({ where: { studentId } });
    await Promise.all(
      leaderboards.map((lb) =>
        this.prisma.leaderboard.update({
          where: { id: lb.id },
          data: { badgeCount: { increment: 1 } },
        }),
      ),
    );

    return award;
  }

  async getStudentProfile(studentId: string) {
    const pointsAgg = await this.prisma.studentPoints.aggregate({
      where: { studentId },
      _sum: { points: true },
    });
    const totalPoints = pointsAgg._sum.points ?? 0;
    const level = calculateLevel(totalPoints);

    const badges = await this.prisma.badgeAward.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });

    const pointsHistory = await this.prisma.studentPoints.findMany({
      where: { studentId },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    // Get rank from leaderboard (take first class found)
    const leaderboard = await this.prisma.leaderboard.findFirst({ where: { studentId } });

    const pointsToNextLevel = (level * 100) - totalPoints;

    return {
      studentId,
      totalPoints,
      level,
      levelTitle: getLevelTitle(level),
      pointsToNextLevel: pointsToNextLevel > 0 ? pointsToNextLevel : 0,
      levelProgressPercent: ((totalPoints % 100) / 100) * 100,
      rank: leaderboard?.rank ?? null,
      badgeCount: badges.length,
      badges,
      pointsHistory,
    };
  }

  async getLeaderboard(classId: string, limit = 20) {
    const entries = await this.prisma.leaderboard.findMany({
      where: { classId },
      orderBy: [{ totalPoints: 'desc' }, { badgeCount: 'desc' }],
      take: limit,
    });

    return entries.map((entry, index) => ({
      ...entry,
      rank: index + 1,
      levelTitle: getLevelTitle(entry.level),
    }));
  }

  async updateLeaderboard(classId: string) {
    // Get all leaderboard entries for this class
    const entries = await this.prisma.leaderboard.findMany({
      where: { classId },
      orderBy: { totalPoints: 'desc' },
    });

    // Recalculate all student totals from StudentPoints
    await Promise.all(
      entries.map(async (entry) => {
        const agg = await this.prisma.studentPoints.aggregate({
          where: { studentId: entry.studentId },
          _sum: { points: true },
        });
        const totalPoints = agg._sum.points ?? 0;
        const badgeCount = await this.prisma.badgeAward.count({ where: { studentId: entry.studentId } });
        const level = calculateLevel(totalPoints);
        return this.prisma.leaderboard.update({
          where: { id: entry.id },
          data: { totalPoints, level, badgeCount },
        });
      }),
    );

    // Now re-rank
    const updated = await this.prisma.leaderboard.findMany({
      where: { classId },
      orderBy: { totalPoints: 'desc' },
    });
    await Promise.all(
      updated.map((entry, index) =>
        this.prisma.leaderboard.update({
          where: { id: entry.id },
          data: { rank: index + 1 },
        }),
      ),
    );

    return this.getLeaderboard(classId);
  }

  async ensureLeaderboardEntry(studentId: string, classId: string) {
    const existing = await this.prisma.leaderboard.findUnique({
      where: { studentId_classId: { studentId, classId } },
    });
    if (existing) return existing;

    const agg = await this.prisma.studentPoints.aggregate({
      where: { studentId },
      _sum: { points: true },
    });
    const totalPoints = agg._sum.points ?? 0;
    const badgeCount = await this.prisma.badgeAward.count({ where: { studentId } });
    const level = calculateLevel(totalPoints);

    return this.prisma.leaderboard.create({
      data: { studentId, classId, totalPoints, level, badgeCount },
    });
  }

  async createBadge(data: {
    name: string;
    description?: string;
    iconUrl?: string;
    category: string;
    criteria?: string;
    pointsValue?: number;
    schoolId: string;
  }) {
    return this.prisma.badge.create({ data: { ...data, pointsValue: data.pointsValue ?? 0 } });
  }

  async getBadges(schoolId: string) {
    return this.prisma.badge.findMany({
      where: { schoolId },
      include: { _count: { select: { awards: true } } },
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });
  }

  async getStudentBadges(studentId: string) {
    return this.prisma.badgeAward.findMany({
      where: { studentId },
      include: { badge: true },
      orderBy: { awardedAt: 'desc' },
    });
  }
}
