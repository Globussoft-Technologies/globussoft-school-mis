import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// Mon=1 .. Sat=6 (matches DB dayOfWeek: 0=Sun,1=Mon,...,6=Sat)
const SCHOOL_DAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat
const PERIODS_PER_DAY = 8;
const BREAK_PERIODS = [4, 7];
const ASSEMBLY_DAY = 1; // Monday
const ASSEMBLY_PERIOD = 1;

// Period time slots (HH:mm)
const PERIOD_TIMES: { start: string; end: string }[] = [
  { start: '08:00', end: '08:45' }, // P1
  { start: '08:45', end: '09:30' }, // P2
  { start: '09:30', end: '10:15' }, // P3
  { start: '10:15', end: '10:30' }, // P4 BREAK
  { start: '10:30', end: '11:15' }, // P5
  { start: '11:15', end: '12:00' }, // P6
  { start: '12:00', end: '12:15' }, // P7 BREAK
  { start: '12:15', end: '13:00' }, // P8
];

interface SubjectAllocation {
  subjectId: string;
  subjectName: string;
  teacherId: string | null;
  periodsNeeded: number;
  periodsAssigned: number;
}

function getSubjectCategory(name: string): 'MATH_SCIENCE' | 'LANGUAGE' | 'OTHER' {
  const lower = name.toLowerCase();
  if (lower.includes('math') || lower.includes('science') || lower.includes('physics') ||
      lower.includes('chemistry') || lower.includes('biology')) {
    return 'MATH_SCIENCE';
  }
  if (lower.includes('english') || lower.includes('hindi') || lower.includes('language') ||
      lower.includes('french') || lower.includes('german') || lower.includes('urdu') ||
      lower.includes('sanskrit')) {
    return 'LANGUAGE';
  }
  return 'OTHER';
}

function periodsForSubject(name: string): number {
  const cat = getSubjectCategory(name);
  if (cat === 'MATH_SCIENCE') return 6;
  if (cat === 'LANGUAGE') return 5;
  return 3;
}

@Injectable()
export class TimetableGeneratorService {
  constructor(private prisma: PrismaService) {}

  async generateTimetable(
    classId: string,
    sectionId: string,
    academicSessionId: string,
  ) {
    // 1. Fetch class info
    const cls = await this.prisma.class.findUnique({ where: { id: classId } });
    if (!cls) throw new NotFoundException('Class not found');

    const section = await this.prisma.section.findUnique({ where: { id: sectionId } });
    if (!section) throw new NotFoundException('Section not found');

    // 2. Fetch subjects for the class
    const subjects = await this.prisma.subject.findMany({
      where: { classId },
      include: { teachers: { include: { teacher: true } } },
    });
    if (subjects.length === 0) {
      throw new BadRequestException('No subjects found for this class');
    }

    // 3. Build subject allocations
    const allocations: SubjectAllocation[] = subjects.map((s) => ({
      subjectId: s.id,
      subjectName: s.name,
      teacherId: s.teachers[0]?.teacherId ?? null,
      periodsNeeded: periodsForSubject(s.name),
      periodsAssigned: 0,
    }));

    // 4. Get existing timetable slots for teacher conflict checking
    // We'll check per-slot during assignment

    // 5. Build the week grid
    // grid[dayOfWeek][periodIndex] = slot data or null
    const grid: Array<Array<{
      subjectId: string | null;
      teacherId: string | null;
      type: string;
    } | null>> = SCHOOL_DAYS.map(() =>
      Array.from({ length: PERIODS_PER_DAY }, () => null),
    );

    // 6. Mark breaks and assembly
    for (let di = 0; di < SCHOOL_DAYS.length; di++) {
      const day = SCHOOL_DAYS[di];
      for (const bp of BREAK_PERIODS) {
        const periodIdx = bp - 1;
        grid[di][periodIdx] = { subjectId: null, teacherId: null, type: 'BREAK' };
      }
      if (day === ASSEMBLY_DAY) {
        const periodIdx = ASSEMBLY_PERIOD - 1;
        grid[di][periodIdx] = { subjectId: null, teacherId: null, type: 'ASSEMBLY' };
      }
    }

    // 7. Collect all available slots
    const availableSlots: { di: number; pi: number }[] = [];
    for (let di = 0; di < SCHOOL_DAYS.length; di++) {
      for (let pi = 0; pi < PERIODS_PER_DAY; pi++) {
        if (grid[di][pi] === null) {
          availableSlots.push({ di, pi });
        }
      }
    }

    // Shuffle available slots for randomness
    for (let i = availableSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    // 8. Get existing timetable slots (other classes) for conflict detection
    const existingSlots = await this.prisma.timetableSlot.findMany({
      where: {
        timetable: {
          academicSessionId,
          NOT: { classId, sectionId },
        },
        teacherId: { not: null },
      },
    });

    // Build teacher busy map: teacherId -> Set of "dayOfWeek-startTime"
    const teacherBusy = new Map<string, Set<string>>();
    for (const es of existingSlots) {
      if (!es.teacherId) continue;
      if (!teacherBusy.has(es.teacherId)) {
        teacherBusy.set(es.teacherId, new Set());
      }
      teacherBusy.get(es.teacherId)!.add(`${es.dayOfWeek}-${es.startTime}`);
    }

    // 9. Assign subjects to slots
    let slotIdx = 0;
    for (const alloc of allocations) {
      let assigned = 0;
      for (; slotIdx < availableSlots.length && assigned < alloc.periodsNeeded; slotIdx++) {
        const { di, pi } = availableSlots[slotIdx];
        if (grid[di][pi] !== null) continue; // already filled

        const day = SCHOOL_DAYS[di];
        const timeSlot = PERIOD_TIMES[pi];
        const slotKey = `${day}-${timeSlot.start}`;

        // Check teacher conflict
        if (alloc.teacherId) {
          const busySet = teacherBusy.get(alloc.teacherId);
          if (busySet?.has(slotKey)) continue; // teacher busy, skip this slot
        }

        grid[di][pi] = {
          subjectId: alloc.subjectId,
          teacherId: alloc.teacherId,
          type: 'LECTURE',
        };

        // Mark teacher as busy for this slot (within this timetable too)
        if (alloc.teacherId) {
          if (!teacherBusy.has(alloc.teacherId)) {
            teacherBusy.set(alloc.teacherId, new Set());
          }
          teacherBusy.get(alloc.teacherId)!.add(slotKey);
        }

        assigned++;
        alloc.periodsAssigned++;
      }
    }

    // Fill remaining empty slots with FREE
    for (let di = 0; di < SCHOOL_DAYS.length; di++) {
      for (let pi = 0; pi < PERIODS_PER_DAY; pi++) {
        if (grid[di][pi] === null) {
          grid[di][pi] = { subjectId: null, teacherId: null, type: 'FREE' };
        }
      }
    }

    // 10. Deactivate existing timetable for this class/section/session
    await this.prisma.timetable.updateMany({
      where: { classId, sectionId, academicSessionId, effectiveTo: null },
      data: { effectiveTo: new Date() },
    });

    // 11. Create new Timetable record
    const timetable = await this.prisma.timetable.create({
      data: {
        classId,
        sectionId,
        academicSessionId,
        effectiveFrom: new Date(),
      },
    });

    // 12. Create TimetableSlot records
    const slotsData = [];
    for (let di = 0; di < SCHOOL_DAYS.length; di++) {
      const day = SCHOOL_DAYS[di];
      for (let pi = 0; pi < PERIODS_PER_DAY; pi++) {
        const cell = grid[di][pi]!;
        const time = PERIOD_TIMES[pi];
        slotsData.push({
          timetableId: timetable.id,
          dayOfWeek: day,
          startTime: time.start,
          endTime: time.end,
          subjectId: cell.subjectId ?? undefined,
          teacherId: cell.teacherId ?? undefined,
          type: cell.type,
        });
      }
    }

    await this.prisma.timetableSlot.createMany({ data: slotsData });

    // 13. Return the full timetable
    return this.prisma.timetable.findUnique({
      where: { id: timetable.id },
      include: {
        class: true,
        section: true,
        slots: {
          include: { subject: true },
          orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        },
      },
    });
  }

  async validateTimetable(timetableId: string) {
    const timetable = await this.prisma.timetable.findUnique({
      where: { id: timetableId },
      include: {
        slots: { include: { subject: true } },
        class: true,
        section: true,
      },
    });
    if (!timetable) throw new NotFoundException('Timetable not found');

    const conflicts: Array<{
      type: string;
      description: string;
      day: number;
      time: string;
      teacherId?: string;
    }> = [];

    // Check teacher double-booking across all timetables in same session
    const sessionSlots = await this.prisma.timetableSlot.findMany({
      where: {
        timetable: {
          academicSessionId: timetable.academicSessionId,
          NOT: { id: timetableId },
        },
        teacherId: { not: null },
      },
    });

    const teacherSlotMap = new Map<string, string>();
    for (const s of sessionSlots) {
      if (s.teacherId) {
        const key = `${s.teacherId}-${s.dayOfWeek}-${s.startTime}`;
        teacherSlotMap.set(key, s.timetableId);
      }
    }

    for (const slot of timetable.slots) {
      if (!slot.teacherId) continue;
      const key = `${slot.teacherId}-${slot.dayOfWeek}-${slot.startTime}`;
      if (teacherSlotMap.has(key)) {
        conflicts.push({
          type: 'TEACHER_CONFLICT',
          description: `Teacher (${slot.teacherId}) is assigned to another class at the same time`,
          day: slot.dayOfWeek,
          time: slot.startTime,
          teacherId: slot.teacherId,
        });
      }
    }

    // Check break periods have correct type
    for (const slot of timetable.slots) {
      const periodNum = PERIOD_TIMES.findIndex(
        (t) => t.start === slot.startTime,
      ) + 1;
      if (BREAK_PERIODS.includes(periodNum) && slot.type !== 'BREAK') {
        conflicts.push({
          type: 'MISSING_BREAK',
          description: `Period ${periodNum} on day ${slot.dayOfWeek} should be a break`,
          day: slot.dayOfWeek,
          time: slot.startTime,
        });
      }
    }

    return {
      timetableId,
      className: timetable.class.name,
      sectionName: timetable.section.name,
      isValid: conflicts.length === 0,
      conflictCount: conflicts.length,
      conflicts,
    };
  }

  async getConflicts(classId?: string) {
    const where: Record<string, unknown> = {};
    if (classId) where.classId = classId;

    const timetables = await this.prisma.timetable.findMany({
      where: { ...where, effectiveTo: null },
      include: {
        class: true,
        section: true,
        slots: true,
      },
    });

    const conflicts: Array<{
      timetableId: string;
      className: string;
      sectionName: string;
      type: string;
      description: string;
      day: number;
      time: string;
      teacherId?: string;
    }> = [];

    // Build a map of teacherId+day+time -> timetable IDs
    const teacherTimeMap = new Map<string, string[]>();
    for (const tt of timetables) {
      for (const slot of tt.slots) {
        if (!slot.teacherId) continue;
        const key = `${slot.teacherId}-${slot.dayOfWeek}-${slot.startTime}`;
        if (!teacherTimeMap.has(key)) teacherTimeMap.set(key, []);
        teacherTimeMap.get(key)!.push(tt.id);
      }
    }

    for (const tt of timetables) {
      for (const slot of tt.slots) {
        if (!slot.teacherId) continue;
        const key = `${slot.teacherId}-${slot.dayOfWeek}-${slot.startTime}`;
        const ttIds = teacherTimeMap.get(key)!;
        if (ttIds.length > 1 && ttIds[0] === tt.id) {
          conflicts.push({
            timetableId: tt.id,
            className: tt.class.name,
            sectionName: tt.section.name,
            type: 'TEACHER_DOUBLE_BOOKED',
            description: `Teacher ${slot.teacherId} is assigned to multiple classes at day ${slot.dayOfWeek} ${slot.startTime}`,
            day: slot.dayOfWeek,
            time: slot.startTime,
            teacherId: slot.teacherId,
          });
        }
      }
    }

    return { totalConflicts: conflicts.length, conflicts };
  }
}
