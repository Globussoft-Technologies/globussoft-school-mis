const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const p = new PrismaClient();

async function main() {
  const school = await p.school.findFirst();
  const session = await p.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!school || !session) { console.log('No school/session'); return; }

  const class1 = await p.class.findFirst({ where: { grade: 1, schoolId: school.id } });
  if (!class1) { console.log('No Class 1'); return; }

  const sectionA = await p.section.findFirst({ where: { classId: class1.id, name: 'A' } });
  if (!sectionA) { console.log('No Section A'); return; }

  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  const subjects = await p.subject.findMany({ where: { classId: class1.id } });
  const passwordHash = await bcrypt.hash('password123', 10);

  console.log(`Class 1 (${class1.id}), Section A (${sectionA.id}), ${subjects.length} subjects`);

  // ─── 1. Create 20 Students ────────────────────────────────
  console.log('\n--- Creating Students ---');
  const firstNames = ['Aarav', 'Diya', 'Vihaan', 'Ananya', 'Arjun', 'Myra', 'Sai', 'Sara', 'Krishna', 'Ira',
    'Reyansh', 'Aanya', 'Ayaan', 'Pihu', 'Ishaan', 'Kavya', 'Advait', 'Nisha', 'Rohan', 'Tara'];
  const lastNames = ['Sharma', 'Patel', 'Verma', 'Singh', 'Kumar', 'Gupta', 'Mishra', 'Yadav', 'Joshi', 'Dubey',
    'Agarwal', 'Chouhan', 'Tiwari', 'Reddy', 'Saxena', 'Jain', 'Mehta', 'Pandey', 'Thakur', 'Soni'];

  const studentIds = [];
  for (let i = 0; i < 20; i++) {
    const fn = firstNames[i], ln = lastNames[i];
    const email = `${fn.toLowerCase()}.${ln.toLowerCase()}.1a@student.medicaps.edu.in`;
    const admNo = `MIS-1A-${String(i + 1).padStart(3, '0')}`;

    try {
      const existing = await p.student.findFirst({ where: { admissionNo: admNo } });
      if (existing) { studentIds.push(existing.id); continue; }

      const user = await p.user.create({
        data: { email, passwordHash, firstName: fn, lastName: ln, role: 'STUDENT', schoolId: school.id },
      });
      const student = await p.student.create({
        data: {
          admissionNo: admNo, userId: user.id, classId: class1.id, sectionId: sectionA.id,
          rollNo: i + 1, dateOfBirth: new Date(2020 - 1, (i * 2) % 12, (i * 3 % 28) + 1),
          gender: i % 2 === 0 ? 'MALE' : 'FEMALE', bloodGroup: ['A+', 'B+', 'O+', 'AB+'][i % 4],
          addressLine1: `${100 + i} Vijay Nagar`, city: 'Indore', state: 'Madhya Pradesh',
          pincode: '452010', academicSessionId: session.id,
        },
      });
      // Add guardian
      await p.guardian.create({
        data: { studentId: student.id, relation: 'FATHER', name: `Mr. ${ln}`, phone: `98765${String(20000 + i).slice(-5)}` },
      });
      studentIds.push(student.id);
    } catch (e) { console.log(`  Skip student ${i}: ${e.message?.substring(0, 50)}`); }
  }
  console.log(`Students: ${studentIds.length}`);

  // ─── 2. Attendance for last 5 days ────────────────────────
  console.log('\n--- Seeding Attendance ---');
  let attCount = 0;
  for (let d = 0; d < 5; d++) {
    const date = new Date(); date.setDate(date.getDate() - d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    const dateOnly = new Date(date.toISOString().split('T')[0]);
    for (const sid of studentIds) {
      const status = Math.random() < 0.85 ? 'PRESENT' : Math.random() < 0.5 ? 'ABSENT' : 'LATE';
      try {
        await p.attendance.upsert({
          where: { studentId_date: { studentId: sid, date: dateOnly } },
          update: { status }, create: { studentId: sid, date: dateOnly, status, markedById: teacher.id },
        });
        attCount++;
      } catch {}
    }
  }
  console.log(`Attendance: ${attCount}`);

  // ─── 3. Timetable ─────────────────────────────────────────
  console.log('\n--- Seeding Timetable ---');
  try {
    const existing = await p.timetable.findFirst({ where: { classId: class1.id, sectionId: sectionA.id, effectiveTo: null } });
    if (!existing && subjects.length > 0) {
      const tt = await p.timetable.create({
        data: { classId: class1.id, sectionId: sectionA.id, academicSessionId: session.id, effectiveFrom: new Date('2026-04-01') },
      });
      const schedule = [
        { start: '08:00', end: '08:30', type: 'ASSEMBLY' },
        { start: '08:30', end: '09:15', type: 'LECTURE' },
        { start: '09:15', end: '10:00', type: 'LECTURE' },
        { start: '10:00', end: '10:15', type: 'BREAK' },
        { start: '10:15', end: '11:00', type: 'LECTURE' },
        { start: '11:00', end: '11:45', type: 'LECTURE' },
        { start: '11:45', end: '12:15', type: 'BREAK' },
        { start: '12:15', end: '13:00', type: 'LECTURE' },
      ];
      let slotCount = 0;
      for (let day = 1; day <= 5; day++) {
        let subIdx = 0;
        for (const slot of schedule) {
          const subjectId = slot.type === 'LECTURE' ? subjects[subIdx++ % subjects.length]?.id : null;
          await p.timetableSlot.create({
            data: { timetableId: tt.id, dayOfWeek: day, startTime: slot.start, endTime: slot.end, type: slot.type, subjectId, room: `Room 1${day}` },
          });
          slotCount++;
        }
      }
      console.log(`Timetable: ${slotCount} slots`);
    } else console.log('Timetable: already exists');
  } catch (e) { console.log(`Timetable error: ${e.message?.substring(0, 80)}`); }

  // ─── 4. Assignments ───────────────────────────────────────
  console.log('\n--- Seeding Assignments ---');
  let assignCount = 0;
  const assignTitles = ['Draw Your Family', 'Count Objects in the Room', 'Write Your Name', 'Color the Animals', 'Simple Addition Worksheet'];
  for (const [i, title] of assignTitles.entries()) {
    const subject = subjects[i % subjects.length];
    if (!subject) continue;
    try {
      const a = await p.assignment.create({
        data: {
          title, type: ['TEXT_RESPONSE', 'FILE_SUBMISSION', 'TEXT_RESPONSE'][i % 3],
          subjectId: subject.id, classId: class1.id, sectionId: sectionA.id,
          teacherId: teacher.id, dueDate: new Date(Date.now() + (i + 1) * 86400000 * 2),
          totalMarks: 10, isPublished: true, academicSessionId: session.id,
        },
      });
      // Add 5 submissions
      for (let s = 0; s < Math.min(5, studentIds.length); s++) {
        try {
          await p.assignmentSubmission.create({
            data: { assignmentId: a.id, studentId: studentIds[s], content: `My answer for ${title}`, status: s < 3 ? 'GRADED' : 'SUBMITTED', marksAwarded: s < 3 ? 7 + s : null, feedback: s < 3 ? 'Good work!' : null },
          });
        } catch {}
      }
      assignCount++;
    } catch {}
  }
  console.log(`Assignments: ${assignCount}`);

  // ─── 5. LMS Content ───────────────────────────────────────
  console.log('\n--- Seeding LMS Content ---');
  let lmsCount = 0;
  const lmsItems = [
    { title: 'ABC Song Video', type: 'VIDEO', desc: 'Learn alphabets with a fun song' },
    { title: 'Numbers 1-100 Chart', type: 'DOCUMENT', desc: 'Printable number chart' },
    { title: 'Hindi Varnamala Presentation', type: 'PRESENTATION', desc: 'Learn Hindi alphabets' },
    { title: 'My First Science Lesson', type: 'VIDEO', desc: 'Introduction to plants and animals' },
    { title: 'Shapes and Colors', type: 'INTERACTIVE', desc: 'Interactive shapes activity' },
  ];
  for (const [i, item] of lmsItems.entries()) {
    const subject = subjects[i % subjects.length];
    if (!subject) continue;
    try {
      await p.lmsContent.create({
        data: { title: item.title, description: item.desc, type: item.type, subjectId: subject.id, classId: class1.id, uploadedBy: teacher.id, isPublished: true },
      });
      lmsCount++;
    } catch {}
  }
  console.log(`LMS Content: ${lmsCount}`);

  // ─── 6. Grades ─────────────────────────────────────────────
  console.log('\n--- Seeding Grades ---');
  let gradeCount = 0;
  for (const sid of studentIds.slice(0, 15)) {
    for (const subject of subjects.slice(0, 3)) {
      const marks = 50 + Math.floor(Math.random() * 50);
      const pct = marks;
      const label = pct >= 91 ? 'A1' : pct >= 81 ? 'A2' : pct >= 71 ? 'B1' : pct >= 61 ? 'B2' : pct >= 51 ? 'C1' : 'C2';
      try {
        await p.grade.create({
          data: { studentId: sid, subjectId: subject.id, type: 'ASSESSMENT', marksObtained: marks, maxMarks: 100, percentage: pct, gradeLabel: label, gradedBy: teacher.id },
        });
        gradeCount++;
      } catch {}
    }
  }
  console.log(`Grades: ${gradeCount}`);

  // ─── 7. Fee Payments ───────────────────────────────────────
  console.log('\n--- Seeding Fee Payments ---');
  const feeHead = await p.feeHead.findFirst();
  let feeCount = 0;
  if (feeHead) {
    for (const sid of studentIds.slice(0, 10)) {
      try {
        await p.payment.create({
          data: { studentId: sid, feeHeadId: feeHead.id, amount: 5000, paidAmount: 5000, method: ['CASH', 'ONLINE', 'UPI'][feeCount % 3], receiptNo: `RCP-1A-${String(feeCount + 1).padStart(4, '0')}`, status: 'PAID', paidAt: new Date() },
        });
        feeCount++;
      } catch {}
    }
  }
  console.log(`Payments: ${feeCount}`);

  // ─── 8. Hobby Enrollments ──────────────────────────────────
  console.log('\n--- Seeding Hobby Enrollments ---');
  const hobbies = await p.hobby.findMany({ take: 5 });
  let hobbyCount = 0;
  for (const [i, sid] of studentIds.slice(0, 10).entries()) {
    const hobby = hobbies[i % hobbies.length];
    if (!hobby) continue;
    try {
      await p.hobbyEnrollment.create({
        data: { studentId: sid, hobbyId: hobby.id, academicSessionId: session.id, status: 'ENROLLED', level: 'BEGINNER' },
      });
      hobbyCount++;
    } catch {}
  }
  console.log(`Hobby Enrollments: ${hobbyCount}`);

  // ─── 9. Notifications ─────────────────────────────────────
  console.log('\n--- Seeding Notifications ---');
  let notifCount = 0;
  const notifTypes = ['ATTENDANCE', 'HOMEWORK', 'GENERAL', 'TEST_RESULT', 'FEE_DUE'];
  for (const [i, sid] of studentIds.slice(0, 10).entries()) {
    const student = await p.student.findUnique({ where: { id: sid }, include: { user: true } });
    if (!student) continue;
    try {
      await p.notification.create({
        data: { userId: student.userId, title: `Class 1A Update`, message: `Notification for ${student.user.firstName}`, type: notifTypes[i % 5], channel: 'PUSH', status: 'PENDING' },
      });
      notifCount++;
    } catch {}
  }
  console.log(`Notifications: ${notifCount}`);

  // ─── 10. Diary Entries ─────────────────────────────────────
  console.log('\n--- Seeding Diary Entries ---');
  let diaryCount = 0;
  const diaryItems = [
    { type: 'HOMEWORK', subject: 'Mathematics', content: 'Complete page 15-16 of Math workbook. Practice counting 1-50.' },
    { type: 'CLASSWORK', subject: 'English', content: 'We learned letters A-E today. Students practiced writing.' },
    { type: 'CIRCULAR', subject: null, content: 'Annual Day rehearsal starts next week. All students must participate.' },
    { type: 'REMINDER', subject: null, content: 'Bring art supplies (crayons, sketch pens) for tomorrow\'s class.' },
    { type: 'NOTE', subject: 'Hindi', content: 'Students did well in Hindi recitation today. Keep practicing at home.' },
  ];
  for (const [i, item] of diaryItems.entries()) {
    const date = new Date(); date.setDate(date.getDate() - i);
    try {
      await p.diaryEntry.create({
        data: { classId: class1.id, sectionId: sectionA.id, date: new Date(date.toISOString().split('T')[0]), type: item.type, subject: item.subject, content: item.content, createdBy: teacher.id },
      });
      diaryCount++;
    } catch {}
  }
  console.log(`Diary Entries: ${diaryCount}`);

  console.log('\n=== Class 1A Seed Complete ===');
}

main().catch(console.error).finally(() => p.$disconnect());
