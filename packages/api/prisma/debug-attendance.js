const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const class1 = await p.class.findFirst({ where: { grade: 1 }, include: { sections: true } });
  console.log('Class 1:', class1?.id, class1?.name);
  console.log('Sections:', class1?.sections?.map(s => `${s.id} (${s.name})`));

  // Check attendance for this class
  const students = await p.student.findMany({
    where: { classId: class1.id },
    select: { id: true, sectionId: true },
  });
  console.log('Students in Class 1:', students.length);
  console.log('Section IDs:', [...new Set(students.map(s => s.sectionId))]);

  // Check attendance records
  const att = await p.attendance.findMany({
    where: {
      date: new Date('2026-03-20'),
      student: { classId: class1.id },
    },
    take: 5,
  });
  console.log('Attendance for March 20 (via student.classId):', att.length);

  // Direct query
  const att2 = await p.attendance.findMany({
    where: {
      date: new Date('2026-03-20'),
      studentId: { in: students.map(s => s.id) },
    },
    take: 5,
  });
  console.log('Attendance for March 20 (via studentIds):', att2.length);
}

main().catch(console.error).finally(() => p.$disconnect());
