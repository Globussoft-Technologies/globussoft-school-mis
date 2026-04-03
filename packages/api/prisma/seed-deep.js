const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.findFirst();
  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  const teachers = await prisma.user.findMany({ where: { role: 'CLASS_TEACHER' }, take: 6 });
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  const students = await prisma.student.findMany({ take: 30, include: { class: true } });
  const subjects = await prisma.subject.findMany({ take: 10 });
  const classes = await prisma.class.findMany({ include: { sections: true } });
  if (!school || !admin || students.length === 0) { console.log('Missing data'); return; }

  // 1. Payroll Records
  console.log('--- Payroll ---');
  let c1 = 0;
  for (const t of teachers) {
    for (let m = 0; m < 3; m++) {
      try {
        await prisma.payrollRecord.create({
          data: {
            userId: t.id, month: m + 1, year: 2026,
            basicSalary: 45000, hra: 15000, da: 5000, ta: 3000,
            deductions: 5000, netSalary: 63000,
            status: 'PAID', paidAt: new Date(2026, m, 28)
          }
        });
        c1++;
      } catch(e) {}
    }
  }
  console.log(`  ${c1} payroll records`);

  // 2. Salary Structures (more)
  console.log('--- Salary Structures ---');
  const roles = ['CLASS_TEACHER','ACCOUNTANT','LIBRARIAN','TRANSPORT_MANAGER','PRINCIPAL'];
  for (const r of roles) {
    try {
      await prisma.salaryStructure.create({
        data: { role: r, basicSalary: 40000 + Math.floor(Math.random()*20000), hra: 15000, da: 5000, ta: 3000, specialAllowance: 2000, pf: 3600, esi: 1200, tds: 2000, schoolId: school.id }
      });
    } catch(e) {}
  }
  console.log('  Created salary structures');

  // 3. More Diary Entries
  console.log('--- Diary Entries ---');
  let c3 = 0;
  for (let d = 1; d <= 15; d++) {
    const date = new Date(2026, 2, d + 5);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const cls of classes.slice(0, 3)) {
      try {
        await prisma.diaryEntry.create({
          data: {
            classId: cls.id, sectionId: cls.sections[0]?.id,
            date, content: `Homework: Complete exercises from Chapter ${d}. Bring art supplies tomorrow.`,
            createdBy: teachers[0].id, schoolId: school.id
          }
        });
        c3++;
      } catch(e) {}
    }
  }
  console.log(`  ${c3} diary entries`);

  // 4. More Visitor Logs
  console.log('--- Visitor Logs ---');
  const visitors = [
    { name: 'Rajesh Kumar', phone: '9876543210', purpose: 'Parent meeting', toMeet: 'Class Teacher' },
    { name: 'Sunita Devi', phone: '9876543211', purpose: 'Fee enquiry', toMeet: 'Accounts Dept' },
    { name: 'Amit Verma', phone: '9876543212', purpose: 'Admission enquiry', toMeet: 'Principal' },
    { name: 'Priya Sharma', phone: '9876543213', purpose: 'Book delivery', toMeet: 'Librarian' },
    { name: 'Vikram Singh', phone: '9876543214', purpose: 'Sports equipment delivery', toMeet: 'Sports Dept' },
    { name: 'Manish Tiwari', phone: '9876543215', purpose: 'Parent meeting', toMeet: 'Class Teacher' },
    { name: 'Deepa Joshi', phone: '9876543216', purpose: 'Transfer certificate', toMeet: 'Admin Office' },
    { name: 'Suresh Patel', phone: '9876543217', purpose: 'Annual day preparation', toMeet: 'Event Coordinator' },
  ];
  for (const v of visitors) {
    try {
      await prisma.visitorLog.create({
        data: { ...v, schoolId: school.id, checkIn: new Date(2026, 2, 20 + Math.floor(Math.random()*5), 9 + Math.floor(Math.random()*6)), badge: `V-${Math.floor(Math.random()*999)}` }
      });
    } catch(e) {}
  }
  console.log(`  ${visitors.length} visitor logs`);

  // 5. More Incidents & Disciplinary
  console.log('--- Incidents ---');
  const incidents = [
    { title: 'Late to class', description: 'Student was 20 minutes late without valid reason', severity: 'LOW' },
    { title: 'Mobile phone usage', description: 'Found using mobile phone during class hours', severity: 'MEDIUM' },
    { title: 'Playground injury', description: 'Minor injury during sports period', severity: 'LOW' },
    { title: 'Uniform violation', description: 'Not wearing proper school uniform', severity: 'LOW' },
    { title: 'Verbal altercation', description: 'Verbal argument with classmate during lunch break', severity: 'MEDIUM' },
  ];
  for (let i = 0; i < incidents.length; i++) {
    const inc = incidents[i];
    try {
      const created = await prisma.incident.create({
        data: { ...inc, studentId: students[i].id, reportedBy: teachers[0].id, date: new Date(2026, 2, 10 + i), status: i < 3 ? 'RESOLVED' : 'OPEN' }
      });
      if (i < 3) {
        await prisma.disciplinaryAction.create({
          data: { incidentId: created.id, studentId: students[i].id, action: 'WARNING', description: 'Verbal warning given', assignedBy: teachers[0].id, date: new Date(2026, 2, 11 + i) }
        });
      }
    } catch(e) {}
  }
  console.log(`  ${incidents.length} incidents`);

  // 6. Staff Profiles (more)
  console.log('--- Staff Profiles ---');
  let c6 = 0;
  for (const t of teachers) {
    try {
      await prisma.staffProfile.create({
        data: {
          userId: t.id, department: 'Academics', designation: 'Senior Teacher',
          qualification: 'M.Ed., B.Sc.', experience: 5 + Math.floor(Math.random()*15),
          joiningDate: new Date(2020, 5, 1), schoolId: school.id
        }
      });
      c6++;
    } catch(e) {}
  }
  console.log(`  ${c6} staff profiles`);

  // 7. ID Cards
  console.log('--- ID Cards ---');
  let c7 = 0;
  for (const s of students.slice(0, 20)) {
    try {
      await prisma.idCard.create({
        data: {
          studentId: s.id, cardNumber: `MIS-${2026}-${String(c7+1).padStart(4,'0')}`,
          issueDate: new Date(2026, 3, 1), expiryDate: new Date(2027, 2, 31),
          status: 'ACTIVE', schoolId: school.id
        }
      });
      c7++;
    } catch(e) {}
  }
  console.log(`  ${c7} ID cards`);

  // 8. More Grades
  console.log('--- More Grades ---');
  let c8 = 0;
  for (const s of students.slice(0, 20)) {
    const subs = await prisma.subject.findMany({ where: { classId: s.classId }, take: 5 });
    for (const sub of subs) {
      const marks = 40 + Math.floor(Math.random() * 60);
      const pct = marks;
      try {
        await prisma.grade.create({
          data: {
            studentId: s.id, subjectId: sub.id, type: 'ASSESSMENT',
            marksObtained: marks, maxMarks: 100, percentage: pct,
            gradeLabel: pct > 90 ? 'A+' : pct > 75 ? 'A' : pct > 60 ? 'B+' : pct > 50 ? 'B' : 'C',
            gradedBy: teachers[0].id, remarks: pct > 75 ? 'Excellent' : 'Good'
          }
        });
        c8++;
      } catch(e) {}
    }
  }
  console.log(`  ${c8} grades`);

  // 9. More Discussion Forums & Posts
  console.log('--- Discussion Forums ---');
  const forums = [
    { title: 'Mathematics Help', description: 'Ask and answer math questions' },
    { title: 'Science Projects', description: 'Share your science project ideas' },
    { title: 'Book Club', description: 'Discuss books and reading' },
    { title: 'Career Guidance', description: 'Questions about career paths' },
    { title: 'Coding Club', description: 'Programming discussions and help' },
  ];
  for (const f of forums) {
    try {
      const forum = await prisma.discussionForum.create({
        data: { ...f, createdBy: teachers[0].id, schoolId: school.id, isActive: true }
      });
      for (let p = 0; p < 5; p++) {
        await prisma.discussionPost.create({
          data: {
            forumId: forum.id, content: `This is a sample discussion post #${p+1} about ${f.title}.`,
            authorId: p < 2 ? teachers[Math.min(p, teachers.length-1)].id : students[p].userId,
            isPinned: p === 0
          }
        });
      }
    } catch(e) {}
  }
  console.log('  Created forums & posts');

  // 10. Learning Paths with Steps & Enrollments
  console.log('--- Learning Paths ---');
  const paths = [
    { title: 'Mathematics Mastery - Class 10', description: 'Complete math learning path' },
    { title: 'Science Explorer', description: 'Explore all science topics' },
    { title: 'English Proficiency', description: 'Improve English skills step by step' },
  ];
  const modules = await prisma.courseModule.findMany({ take: 15 });
  for (let i = 0; i < paths.length; i++) {
    try {
      const lp = await prisma.learningPath.create({
        data: { ...paths[i], createdBy: teachers[0].id, schoolId: school.id, isPublished: true }
      });
      for (let s = 0; s < 3; s++) {
        if (modules[i*3+s]) {
          await prisma.learningPathStep.create({
            data: { learningPathId: lp.id, moduleId: modules[i*3+s].id, orderIndex: s+1 }
          }).catch(() => {});
        }
      }
      for (const st of students.slice(0, 5)) {
        await prisma.learningPathEnrollment.create({
          data: { learningPathId: lp.id, studentId: st.id, progress: Math.floor(Math.random()*100), status: 'IN_PROGRESS' }
        }).catch(() => {});
      }
    } catch(e) {}
  }
  console.log('  Created learning paths');

  // 11. Student Points
  console.log('--- Student Points ---');
  let c11 = 0;
  for (const s of students.slice(0, 20)) {
    try {
      await prisma.studentPoint.create({
        data: { studentId: s.id, points: Math.floor(Math.random() * 500) + 100, reason: 'Academic excellence', awardedBy: admin.id, category: 'ACADEMIC' }
      });
      c11++;
    } catch(e) {}
  }
  console.log(`  ${c11} student points`);

  // 12. Leave Applications
  console.log('--- Leave Applications ---');
  let c12 = 0;
  const reasons = ['Fever and cold','Family function','Medical appointment','Out of station','Religious ceremony'];
  for (const s of students.slice(0, 10)) {
    try {
      await prisma.leaveApplication.create({
        data: {
          userId: s.userId, type: 'SICK', startDate: new Date(2026, 2, 15),
          endDate: new Date(2026, 2, 17), reason: reasons[Math.floor(Math.random()*reasons.length)],
          status: ['APPROVED','PENDING','REJECTED'][Math.floor(Math.random()*3)], schoolId: school.id
        }
      });
      c12++;
    } catch(e) {}
  }
  console.log(`  ${c12} leave applications`);

  // 13. More Library Issues
  console.log('--- Library Issues ---');
  const books = await prisma.libraryBook.findMany({ take: 10 });
  let c13 = 0;
  for (const b of books.slice(0, 8)) {
    try {
      await prisma.libraryIssue.create({
        data: {
          bookId: b.id, studentId: students[c13 % students.length].id,
          issuedAt: new Date(2026, 2, 1 + c13), dueDate: new Date(2026, 2, 15 + c13),
          status: c13 < 4 ? 'RETURNED' : 'ISSUED',
          returnedAt: c13 < 4 ? new Date(2026, 2, 10 + c13) : null
        }
      });
      c13++;
    } catch(e) {}
  }
  console.log(`  ${c13} library issues`);

  console.log('\n=== DEEP SEED COMPLETE ===');
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
