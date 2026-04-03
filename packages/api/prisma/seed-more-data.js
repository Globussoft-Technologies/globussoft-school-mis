const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  const teachers = await prisma.user.findMany({ where: { role: 'CLASS_TEACHER' }, take: 5 });
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const students = await prisma.student.findMany({ take: 30, include: { class: true, section: true } });
  const classes = await prisma.class.findMany({ include: { sections: true, subjects: true } });
  const subjects = await prisma.subject.findMany({ take: 20 });
  const hobbies = await prisma.hobby.findMany();

  if (!school || !session || !admin) { console.log('Missing base data'); return; }

  // 1. Teacher-Subject assignments
  console.log('--- Teacher Subjects ---');
  let tsCount = 0;
  for (const t of teachers) {
    const subs = subjects.slice(tsCount * 3, tsCount * 3 + 3);
    for (const s of subs) {
      try {
        await prisma.teacherSubject.create({ data: { teacherId: t.id, subjectId: s.id } });
        tsCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${tsCount} teacher-subject links`);

  // 2. Fee Structures
  console.log('--- Fee Structures ---');
  const feeHeads = await prisma.feeHead.findMany();
  for (const cls of classes.slice(0, 4)) {
    try {
      const fs = await prisma.feeStructure.create({
        data: { name: `${cls.name} Fee 2026-27`, classId: cls.id, academicSessionId: session.id, totalAmount: 45000 + cls.grade * 2000 }
      });
      for (const fh of feeHeads.slice(0, 3)) {
        await prisma.feeStructureFeeHead.create({
          data: { feeStructureId: fs.id, feeHeadId: fh.id, amount: 10000 + Math.floor(Math.random() * 5000) }
        }).catch(() => {});
      }
    } catch(e) {}
  }
  console.log('  Created fee structures');

  // 3. Assessment Submissions
  console.log('--- Assessment Submissions ---');
  const assessments = await prisma.assessment.findMany({ take: 5 });
  let subCount = 0;
  for (const a of assessments) {
    for (const s of students.slice(0, 10)) {
      try {
        await prisma.assessmentSubmission.create({
          data: {
            assessmentId: a.id, studentId: s.id, submittedBy: s.userId,
            totalMarks: Math.floor(Math.random() * 40) + 60,
            status: 'GRADED', answers: JSON.stringify([]),
            gradedAt: new Date()
          }
        });
        subCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${subCount} assessment submissions`);

  // 4. Hobby Sessions & Attendance
  console.log('--- Hobby Sessions ---');
  let hsCount = 0;
  for (const h of hobbies.slice(0, 4)) {
    for (let d = 1; d <= 5; d++) {
      const date = new Date(2026, 2, d + 5);
      try {
        const hs = await prisma.hobbySession.create({
          data: {
            hobbyId: h.id, date, startTime: '14:00', endTime: '15:00',
            activity: `${h.name} Practice Session ${d}`, conductedBy: teachers[0].id
          }
        });
        for (const s of students.slice(0, 5)) {
          await prisma.hobbyAttendance.create({
            data: { sessionId: hs.id, studentId: s.id, status: Math.random() > 0.15 ? 'PRESENT' : 'ABSENT' }
          }).catch(() => {});
        }
        hsCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${hsCount} hobby sessions`);

  // 5. More Attendance (last 20 weekdays)
  console.log('--- More Attendance ---');
  let attCount = 0;
  for (let d = 1; d <= 20; d++) {
    const date = new Date(2026, 1, d + 5);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const s of students.slice(0, 20)) {
      const statuses = ['PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','PRESENT','LATE','ABSENT','HALF_DAY'];
      try {
        await prisma.attendance.create({
          data: { studentId: s.id, date, status: statuses[Math.floor(Math.random() * statuses.length)], markedById: teachers[0].id }
        });
        attCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${attCount} attendance records`);

  // 6. More Payments
  console.log('--- More Payments ---');
  let payCount = 0;
  const modes = ['CASH','CHEQUE','ONLINE','UPI','BANK_TRANSFER'];
  for (const s of students.slice(0, 20)) {
    for (let m = 0; m < 3; m++) {
      try {
        await prisma.payment.create({
          data: {
            studentId: s.id, amount: 5000 + Math.floor(Math.random() * 10000),
            mode: modes[Math.floor(Math.random() * modes.length)],
            receiptNo: `RCP-${Date.now()}-${Math.floor(Math.random()*9999)}`,
            paidAt: new Date(2026, m, 10 + Math.floor(Math.random() * 15)),
            receivedBy: admin.id, description: `Term ${m+1} Fee`, status: 'COMPLETED'
          }
        });
        payCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${payCount} payments`);

  // 7. Promotions
  console.log('--- Promotions ---');
  let promoCount = 0;
  for (const s of students.slice(0, 15)) {
    try {
      await prisma.promotion.create({
        data: {
          studentId: s.id, fromClassId: s.classId, fromSectionId: s.sectionId,
          toClassId: s.classId, toSectionId: s.sectionId,
          academicSessionId: session.id, status: 'PROMOTED', remarks: 'Promoted to next class',
          promotedAt: new Date(2026, 2, 31)
        }
      });
      promoCount++;
    } catch(e) {}
  }
  console.log(`  Created ${promoCount} promotions`);

  // 8. More LMS Content
  console.log('--- More LMS Content ---');
  let lmsCount = 0;
  const types = ['VIDEO','DOCUMENT','PRESENTATION','LINK'];
  for (const sub of subjects.slice(0, 8)) {
    for (let i = 0; i < 3; i++) {
      try {
        await prisma.lmsContent.create({
          data: {
            title: `${sub.name} - Study Material ${i+1}`,
            description: `Comprehensive study material for ${sub.name}`,
            type: types[Math.floor(Math.random() * types.length)],
            subjectId: sub.id, classId: sub.classId,
            uploadedBy: teachers[Math.min(i, teachers.length-1)].id,
            isPublished: true, tags: JSON.stringify([sub.name, 'study']),
            duration: Math.floor(Math.random() * 45) + 15
          }
        });
        lmsCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${lmsCount} LMS contents`);

  // 9. More Announcements
  console.log('--- More Announcements ---');
  const announcements = [
    { title: 'Annual Day Celebrations', content: 'Annual Day will be held on April 15, 2026. All students must participate.', priority: 'HIGH' },
    { title: 'Summer Vacation Notice', content: 'Summer vacation from May 15 to June 30, 2026.', priority: 'HIGH' },
    { title: 'PTM Schedule', content: 'Parent-Teacher Meeting scheduled for March 28, 2026 from 9 AM to 1 PM.', priority: 'MEDIUM' },
    { title: 'Sports Day Results', content: 'Congratulations to all winners! Full results available on the notice board.', priority: 'LOW' },
    { title: 'Library Week', content: 'National Library Week celebrations from March 14-20. Special reading sessions daily.', priority: 'MEDIUM' },
    { title: 'Science Exhibition', content: 'Inter-school Science Exhibition on April 5. Registration open till March 30.', priority: 'HIGH' },
    { title: 'Fee Payment Reminder', content: 'Last date for Q4 fee payment is March 31, 2026.', priority: 'HIGH' },
    { title: 'Uniform Guidelines', content: 'Winter uniform to be replaced with summer uniform from April 1.', priority: 'LOW' },
  ];
  for (const a of announcements) {
    try {
      await prisma.announcement.create({
        data: { ...a, schoolId: school.id, publishedAt: new Date(), expiresAt: new Date(2026, 5, 30), createdBy: admin.id }
      });
    } catch(e) {}
  }
  console.log(`  Created ${announcements.length} announcements`);

  // 10. More Calendar Events
  console.log('--- Calendar Events ---');
  const events = [
    { title: 'Republic Day', date: new Date(2026, 0, 26), type: 'HOLIDAY' },
    { title: 'Holi', date: new Date(2026, 2, 14), type: 'HOLIDAY' },
    { title: 'Mid-Term Exams', date: new Date(2026, 3, 1), type: 'EXAM' },
    { title: 'Annual Sports Day', date: new Date(2026, 3, 15), type: 'EVENT' },
    { title: 'Parent-Teacher Meeting', date: new Date(2026, 2, 28), type: 'PTM' },
    { title: 'Science Exhibition', date: new Date(2026, 3, 5), type: 'EVENT' },
    { title: 'Independence Day', date: new Date(2026, 7, 15), type: 'HOLIDAY' },
    { title: 'Final Exams Begin', date: new Date(2026, 2, 1), type: 'EXAM' },
    { title: 'Summer Break Starts', date: new Date(2026, 4, 15), type: 'HOLIDAY' },
    { title: 'Teacher\'s Day', date: new Date(2026, 8, 5), type: 'EVENT' },
  ];
  for (const e of events) {
    try {
      await prisma.calendarEvent.create({
        data: { title: e.title, startDate: e.date, endDate: e.date, type: e.type, schoolId: school.id, isHoliday: e.type === 'HOLIDAY' }
      });
    } catch(ex) {}
  }
  console.log(`  Created ${events.length} calendar events`);

  // 11. More Notifications
  console.log('--- More Notifications ---');
  let notifCount = 0;
  const notifTemplates = [
    'Your attendance for today has been marked',
    'New assignment posted in Mathematics',
    'Fee payment reminder: Due date approaching',
    'PTM slot booked for March 28',
    'Report card published for Term 1',
    'New announcement: Annual Day Celebrations',
    'Library book return reminder',
    'Assessment results published',
  ];
  for (const s of students.slice(0, 15)) {
    for (const msg of notifTemplates.slice(0, 4)) {
      try {
        await prisma.notification.create({
          data: { userId: s.userId, title: msg.split(':')[0], message: msg, type: 'INFO', isRead: Math.random() > 0.5 }
        });
        notifCount++;
      } catch(e) {}
    }
  }
  console.log(`  Created ${notifCount} notifications`);

  // 12. More Report Cards
  console.log('--- Report Cards ---');
  let rcCount = 0;
  for (const s of students.slice(0, 20)) {
    try {
      const rc = await prisma.reportCard.create({
        data: {
          studentId: s.id, classId: s.classId, academicSessionId: session.id,
          term: 'TERM_1', overallPercentage: 60 + Math.random() * 35,
          overallGrade: ['A+','A','B+','B','A'][Math.floor(Math.random()*5)],
          rank: Math.floor(Math.random() * 30) + 1, totalStudents: 40,
          teacherRemarks: 'Good performance. Keep it up!', status: 'PUBLISHED',
          issuedBy: admin.id, issuedAt: new Date()
        }
      });
      const subs = await prisma.subject.findMany({ where: { classId: s.classId }, take: 5 });
      for (const sub of subs) {
        const max = 100; const obt = 50 + Math.floor(Math.random() * 50);
        await prisma.subjectResult.create({
          data: { reportCardId: rc.id, subjectName: sub.name, maxMarks: max, obtained: obt, grade: obt > 90 ? 'A+' : obt > 75 ? 'A' : obt > 60 ? 'B+' : 'B' }
        }).catch(() => {});
      }
      rcCount++;
    } catch(e) {}
  }
  console.log(`  Created ${rcCount} report cards`);

  console.log('\n=== SEED MORE DATA COMPLETE ===');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
