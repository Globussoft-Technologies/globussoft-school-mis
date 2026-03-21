const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const school = await p.school.findFirst();
  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  const classes = await p.class.findMany({ where: { schoolId: school.id }, include: { sections: true } });

  let total = 0;
  // Every weekday in March 2026
  for (let day = 1; day <= 21; day++) {
    const date = new Date(`2026-03-${String(day).padStart(2, '0')}`);
    if (date.getDay() === 0 || date.getDay() === 6) continue; // skip weekends

    for (const cls of classes) {
      for (const section of cls.sections) {
        const students = await p.student.findMany({
          where: { classId: cls.id, sectionId: section.id, isActive: true },
          select: { id: true },
        });
        if (students.length === 0) continue;

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
    }
    process.stdout.write(`Day ${day}: ${total} total\r`);
  }
  console.log(`\nSeeded ${total} attendance records for March 2026`);
}

main().catch(console.error).finally(() => p.$disconnect());
