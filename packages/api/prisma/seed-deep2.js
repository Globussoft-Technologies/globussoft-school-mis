const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  const teachers = await prisma.user.findMany({ where: { role: 'CLASS_TEACHER' }, take: 6 });
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const students = await prisma.student.findMany({ take: 30, include: { user: true, class: true } });
  const allUsers = await prisma.user.findMany({ where: { role: { in: ['CLASS_TEACHER','SUPER_ADMIN','ACCOUNTANT','LIBRARIAN'] } } });
  if (!school || !admin) { console.log('Missing data'); return; }

  // 1. Payroll
  console.log('--- Payroll ---');
  let c1 = 0;
  for (const u of allUsers.slice(0, 8)) {
    for (let m = 1; m <= 3; m++) {
      try {
        await prisma.payrollRecord.create({
          data: { userId: u.id, month: m, year: 2026, basicSalary: 45000, hra: 15000, da: 5000, ta: 3000, deductions: 5000, netSalary: 63000, status: 'PAID', paidAt: new Date(2026, m-1, 28) }
        });
        c1++;
      } catch(e) {}
    }
  }
  console.log(`  ${c1} payroll records`);

  // 2. Diary Entries
  console.log('--- Diary Entries ---');
  let c2 = 0;
  const classes = await prisma.class.findMany({ include: { sections: true }, take: 6 });
  for (let d = 1; d <= 10; d++) {
    const date = new Date(2026, 2, d + 10);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const cls of classes.slice(0, 3)) {
      try {
        await prisma.diaryEntry.create({
          data: { date, classId: cls.id, sectionId: cls.sections[0]?.id, content: `Math: Complete Ex ${d}.${d+1}. Science: Read Ch ${d}. Hindi: Write essay on nature.`, createdBy: teachers[0].id, schoolId: school.id }
        });
        c2++;
      } catch(e) {}
    }
  }
  console.log(`  ${c2} diary entries`);

  // 3. ID Cards (userId based)
  console.log('--- ID Cards ---');
  let c3 = 0;
  for (const s of students.slice(0, 25)) {
    try {
      await prisma.idCard.create({
        data: { userId: s.userId, cardNumber: `MIS-2026-${String(c3+1).padStart(4,'0')}`, issueDate: new Date(2026, 3, 1), expiryDate: new Date(2027, 2, 31), status: 'ACTIVE', schoolId: school.id }
      });
      c3++;
    } catch(e) {}
  }
  console.log(`  ${c3} ID cards`);

  // 4. Staff Profiles (userId based)
  console.log('--- Staff Profiles ---');
  let c4 = 0;
  for (const t of allUsers) {
    try {
      await prisma.staffProfile.create({
        data: { userId: t.id, department: 'Academics', designation: t.role === 'CLASS_TEACHER' ? 'Senior Teacher' : t.role, qualification: 'M.Ed., B.Sc.', experience: 5 + Math.floor(Math.random()*15), joiningDate: new Date(2020, 5, 1), schoolId: school.id }
      });
      c4++;
    } catch(e) {}
  }
  console.log(`  ${c4} staff profiles`);

  // 5. Leave Applications (applicantId)
  console.log('--- Leave Applications ---');
  let c5 = 0;
  const reasons = ['Fever and cold','Family function','Medical appointment','Out of station','Religious ceremony'];
  for (const s of students.slice(0, 15)) {
    try {
      await prisma.leaveApplication.create({
        data: { applicantId: s.userId, type: 'SICK', startDate: new Date(2026, 2, 15 + c5 % 10), endDate: new Date(2026, 2, 17 + c5 % 10), reason: reasons[c5 % reasons.length], status: ['APPROVED','PENDING','REJECTED'][c5 % 3], schoolId: school.id }
      });
      c5++;
    } catch(e) {}
  }
  // Teacher leave too
  for (const t of teachers.slice(0, 3)) {
    try {
      await prisma.leaveApplication.create({
        data: { applicantId: t.id, type: 'CASUAL', startDate: new Date(2026, 2, 20), endDate: new Date(2026, 2, 21), reason: 'Personal work', status: 'APPROVED', schoolId: school.id }
      });
      c5++;
    } catch(e) {}
  }
  console.log(`  ${c5} leave applications`);

  // 6. Library Issues (borrowerId)
  console.log('--- Library Issues ---');
  const books = await prisma.libraryBook.findMany({ take: 15 });
  let c6 = 0;
  for (const b of books) {
    try {
      await prisma.libraryIssue.create({
        data: { bookId: b.id, borrowerId: students[c6 % students.length].userId, issuedAt: new Date(2026, 2, 1 + c6), dueDate: new Date(2026, 2, 15 + c6), status: c6 < 8 ? 'RETURNED' : 'ISSUED', returnedAt: c6 < 8 ? new Date(2026, 2, 10 + c6) : null }
      });
      c6++;
    } catch(e) {}
  }
  console.log(`  ${c6} library issues`);

  // 7. Student Points
  console.log('--- Student Points ---');
  let c7 = 0;
  const categories = ['ACADEMIC','SPORTS','BEHAVIOR','ATTENDANCE','EXTRA_CURRICULAR'];
  const pointReasons = ['Perfect attendance this month','Won quiz competition','Helped in school event','Best project submission','Sports day winner'];
  for (const s of students.slice(0, 25)) {
    for (let p = 0; p < 2; p++) {
      try {
        await prisma.studentPoint.create({
          data: { studentId: s.id, points: Math.floor(Math.random() * 50) + 10, reason: pointReasons[(c7+p) % pointReasons.length], awardedBy: admin.id, category: categories[(c7+p) % categories.length] }
        });
        c7++;
      } catch(e) {}
    }
  }
  console.log(`  ${c7} student points`);

  // 8. More Health Records
  console.log('--- Health Records ---');
  let c8 = 0;
  for (const s of students.slice(0, 20)) {
    try {
      await prisma.healthRecord.create({
        data: { studentId: s.id, bloodGroup: ['A+','B+','O+','AB+','A-'][c8%5], height: 140 + Math.floor(Math.random()*30), weight: 35 + Math.floor(Math.random()*25), allergies: c8 % 3 === 0 ? 'Dust allergy' : null, vision: '6/6', medicalConditions: null, lastCheckup: new Date(2026, 1, 15), schoolId: school.id }
      });
      c8++;
    } catch(e) {}
  }
  console.log(`  ${c8} health records`);

  // 9. Rubric Assessments
  console.log('--- Rubrics ---');
  const rubrics = await prisma.rubric.findMany({ take: 3, include: { criteria: { include: { levels: true } } } });
  let c9 = 0;
  for (const r of rubrics) {
    for (const s of students.slice(0, 5)) {
      try {
        await prisma.rubricAssessment.create({
          data: { rubricId: r.id, studentId: s.id, assessorId: teachers[0].id, totalScore: 15 + Math.floor(Math.random()*10), feedback: 'Good effort. Keep improving.', assessedAt: new Date() }
        });
        c9++;
      } catch(e) {}
    }
  }
  console.log(`  ${c9} rubric assessments`);

  // 10. More Concessions & Defaulters
  console.log('--- Concessions & Defaulters ---');
  let c10 = 0;
  for (const s of students.slice(0, 5)) {
    try {
      await prisma.concession.create({
        data: { studentId: s.id, type: 'SIBLING', percentage: 10 + Math.floor(Math.random()*15), reason: 'Sibling discount', approvedBy: admin.id, status: 'APPROVED', academicSessionId: session.id }
      });
      c10++;
    } catch(e) {}
  }
  for (const s of students.slice(10, 18)) {
    try {
      await prisma.defaulterRecord.create({
        data: { studentId: s.id, amount: 5000 + Math.floor(Math.random()*15000), dueDate: new Date(2026, 1, 28), status: 'PENDING', remindersSent: Math.floor(Math.random()*3), lastReminderAt: new Date(2026, 2, 10) }
      });
      c10++;
    } catch(e) {}
  }
  console.log(`  ${c10} concessions/defaulters`);

  // 11. More Teacher Attendance
  console.log('--- Teacher Attendance ---');
  let c11 = 0;
  for (let d = 1; d <= 20; d++) {
    const date = new Date(2026, 2, d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const t of teachers) {
      try {
        await prisma.teacherAttendance.create({
          data: { userId: t.id, date, status: Math.random() > 0.1 ? 'PRESENT' : 'ABSENT', checkIn: '08:30', checkOut: '15:30', schoolId: school.id }
        });
        c11++;
      } catch(e) {}
    }
  }
  console.log(`  ${c11} teacher attendance`);

  console.log('\n=== DEEP SEED 2 COMPLETE ===');
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
