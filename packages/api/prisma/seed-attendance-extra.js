const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const school = await p.school.findFirst();
  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  const classes = await p.class.findMany({ where: { schoolId: school.id }, include: { sections: true } });

  // Seed attendance for March 17-21, 2026 for ALL classes that have students
  const dates = ['2026-03-17', '2026-03-18', '2026-03-19', '2026-03-20', '2026-03-21'];
  let total = 0;

  for (const cls of classes) {
    for (const section of cls.sections) {
      const students = await p.student.findMany({
        where: { classId: cls.id, sectionId: section.id, isActive: true },
        select: { id: true },
      });
      if (students.length === 0) continue;

      for (const dateStr of dates) {
        const date = new Date(dateStr);
        if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

        for (const student of students) {
          const rand = Math.random();
          const status = rand < 0.82 ? 'PRESENT' : rand < 0.92 ? 'ABSENT' : 'LATE';
          try {
            await p.attendance.upsert({
              where: { studentId_date: { studentId: student.id, date } },
              update: { status },
              create: { studentId: student.id, date, status, markedById: teacher.id },
            });
            total++;
          } catch {}
        }
      }
      if (students.length > 0) {
        console.log(`${cls.name} ${section.name}: ${students.length} students × ${dates.length} days`);
      }
    }
  }
  console.log(`\nTotal attendance records: ${total}`);
}

main().catch(console.error).finally(() => p.$disconnect());
