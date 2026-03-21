import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding Extra Data (Assignments, Teacher Attendance, Leaves, Student Documents) ===\n');

  // ─── Look up existing entities ───────────────────────────────────────────────

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`Found school: ${school.name}`);

  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) throw new Error('No active academic session found.');
  console.log(`Found session: ${session.name}`);

  const class10 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 10 } });
  if (!class10) throw new Error('Class 10 not found.');

  const section10A = await prisma.section.findFirst({ where: { classId: class10.id, name: 'A' } });
  if (!section10A) throw new Error('Section 10A not found.');

  const mathSubject = await prisma.subject.findFirst({
    where: { classId: class10.id, name: 'Mathematics' },
  });
  const scienceSubject = await prisma.subject.findFirst({
    where: { classId: class10.id, name: 'Science' },
  });
  const englishSubject = await prisma.subject.findFirst({
    where: { classId: class10.id, name: 'English' },
  });

  if (!mathSubject) throw new Error('Mathematics subject for Class 10 not found.');
  if (!scienceSubject) throw new Error('Science subject for Class 10 not found.');

  const teachers = await prisma.user.findMany({
    where: { schoolId: school.id, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER'] } },
    take: 3,
  });
  if (teachers.length === 0) throw new Error('No teachers found.');
  const teacher1 = teachers[0];
  const teacher2 = teachers[1] || teachers[0];

  const adminUser = await prisma.user.findFirst({
    where: { schoolId: school.id, role: 'SUPER_ADMIN' },
  });
  if (!adminUser) throw new Error('No admin user found.');

  // Get some students for Class 10A
  const students = await prisma.student.findMany({
    where: { classId: class10.id, sectionId: section10A.id },
    take: 5,
    include: { user: true },
  });
  if (students.length === 0) throw new Error('No students found in Class 10A.');

  const parentUsers = await prisma.user.findMany({
    where: { schoolId: school.id, role: 'PARENT' },
    take: 5,
  });
  const parentUser = parentUsers[0] || adminUser;

  // ─── 1. Assignments (5 for Class 10 subjects) ────────────────────────────────

  console.log('\n--- Seeding 5 Assignments ---');

  const subjectForEnglish = englishSubject || mathSubject;

  const assignmentsData = [
    {
      title: 'Quadratic Equations — Problem Set',
      instructions: 'Solve the 20 quadratic equations using the quadratic formula and factoring methods. Show all working.',
      type: 'FILE_SUBMISSION',
      subjectId: mathSubject.id,
      classId: class10.id,
      sectionId: section10A.id,
      teacherId: teacher1.id,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      totalMarks: 20,
      allowLate: false,
      academicSessionId: session.id,
      isPublished: true,
    },
    {
      title: 'Reflection Essay — My Science Project',
      instructions: 'Write a 500-word reflection on what you learned from your science fair project. Include methodology, findings, and conclusion.',
      type: 'TEXT_RESPONSE',
      subjectId: scienceSubject.id,
      classId: class10.id,
      sectionId: section10A.id,
      teacherId: teacher2.id,
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      totalMarks: 10,
      allowLate: true,
      latePenalty: 2,
      academicSessionId: session.id,
      isPublished: true,
    },
    {
      title: 'Chapter 3 — Trigonometry Quiz',
      instructions: 'Complete the online quiz covering trigonometric identities and ratios. 15 MCQ questions, 1 mark each.',
      type: 'ONLINE_QUIZ',
      subjectId: mathSubject.id,
      classId: class10.id,
      sectionId: section10A.id,
      teacherId: teacher1.id,
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      totalMarks: 15,
      allowLate: false,
      academicSessionId: session.id,
      isPublished: true,
    },
    {
      title: 'Chemical Reactions Lab Report',
      instructions: 'Submit a detailed lab report on the acid-base titration experiment. Include observations, calculations, and inferences.',
      type: 'FILE_SUBMISSION',
      subjectId: scienceSubject.id,
      classId: class10.id,
      sectionId: section10A.id,
      teacherId: teacher2.id,
      dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
      totalMarks: 25,
      allowLate: true,
      latePenalty: 3,
      academicSessionId: session.id,
      isPublished: false,
    },
    {
      title: 'English Grammar — Comprehension Exercise',
      instructions: 'Read the unseen passage and answer all 10 comprehension questions in complete sentences.',
      type: 'TEXT_RESPONSE',
      subjectId: subjectForEnglish.id,
      classId: class10.id,
      sectionId: section10A.id,
      teacherId: teacher1.id,
      dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
      totalMarks: 10,
      allowLate: false,
      academicSessionId: session.id,
      isPublished: true,
    },
  ];

  let assignmentCount = 0;
  for (const aData of assignmentsData) {
    const existing = await prisma.assignment.findFirst({
      where: { title: aData.title, classId: class10.id, academicSessionId: session.id },
    });
    if (!existing) {
      await prisma.assignment.create({ data: aData });
      assignmentCount++;
    }
  }
  console.log(`  Created ${assignmentCount} assignments`);

  // ─── 2. Teacher Attendance (last 5 weekdays × 2 teachers = 10 records) ────────

  console.log('\n--- Seeding 10 Teacher Attendance Records ---');

  function getLastWeekdays(n: number): Date[] {
    const days: Date[] = [];
    const d = new Date();
    // Remove time component
    d.setHours(0, 0, 0, 0);
    while (days.length < n) {
      d.setDate(d.getDate() - 1);
      const dow = d.getDay();
      if (dow !== 0 && dow !== 6) {
        days.push(new Date(d));
      }
    }
    return days;
  }

  const weekdays = getLastWeekdays(5);
  const teacherAttendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT'];

  let taCount = 0;
  for (let i = 0; i < weekdays.length; i++) {
    const date = weekdays[i];
    const status1 = teacherAttendanceStatuses[i];
    const status2 = i === 3 ? 'ABSENT' : 'PRESENT';

    for (const [teacher, status] of [
      [teacher1, status1],
      [teacher2, status2],
    ] as [typeof teacher1, string][]) {
      try {
        await prisma.teacherAttendance.upsert({
          where: { teacherId_date: { teacherId: teacher.id, date } },
          update: { status },
          create: {
            teacherId: teacher.id,
            date,
            status,
            checkIn: status === 'PRESENT' ? '08:30' : status === 'LATE' ? '09:15' : undefined,
            checkOut: status !== 'ABSENT' ? '16:30' : undefined,
            remarks: status === 'LATE' ? 'Traffic delay' : undefined,
          },
        });
        taCount++;
      } catch {
        // skip duplicates
      }
    }
  }
  console.log(`  Created/updated ${taCount} teacher attendance records`);

  // ─── 3. Teacher Leave Applications (3: 1 approved, 1 pending, 1 rejected) ────

  console.log('\n--- Seeding 3 Teacher Leave Applications ---');

  const teacherLeavesData = [
    {
      applicantId: teacher1.id,
      type: 'SICK',
      startDate: new Date('2026-03-10'),
      endDate: new Date('2026-03-11'),
      reason: 'Suffering from fever and flu. Doctor has advised rest.',
      status: 'APPROVED',
      approvedBy: adminUser.id,
      approvedAt: new Date('2026-03-09'),
      remarks: 'Approved. Please arrange substitutes.',
    },
    {
      applicantId: teacher2.id,
      type: 'CASUAL',
      startDate: new Date('2026-03-25'),
      endDate: new Date('2026-03-25'),
      reason: 'Family function — wedding ceremony.',
      status: 'PENDING',
    },
    {
      applicantId: teacher1.id,
      type: 'EARNED',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2026-04-05'),
      reason: 'Personal vacation trip booked.',
      status: 'REJECTED',
      approvedBy: adminUser.id,
      approvedAt: new Date('2026-03-18'),
      remarks: 'Exam period — cannot approve leave during assessments.',
    },
  ];

  let leaveAppCount = 0;
  for (const lData of teacherLeavesData) {
    const existing = await prisma.leaveApplication.findFirst({
      where: {
        applicantId: lData.applicantId,
        startDate: lData.startDate,
        endDate: lData.endDate,
      },
    });
    if (!existing) {
      await prisma.leaveApplication.create({ data: lData as any });
      leaveAppCount++;
    }
  }
  console.log(`  Created ${leaveAppCount} teacher leave applications`);

  // ─── 4. Student Leave Applications (5) ───────────────────────────────────────

  console.log('\n--- Seeding 5 Student Leave Applications ---');

  const studentLeavesData = [
    {
      studentId: students[0].id,
      appliedBy: parentUser.id,
      type: 'SICK',
      startDate: new Date('2026-03-12'),
      endDate: new Date('2026-03-13'),
      reason: 'Child is suffering from viral fever. Doctor has advised 2 days bed rest.',
      status: 'APPROVED',
      approvedBy: teacher1.id,
      approvedAt: new Date('2026-03-11'),
      remarks: 'Approved. Please collect notes from classmates.',
    },
    {
      studentId: students[1 % students.length].id,
      appliedBy: parentUser.id,
      type: 'FAMILY',
      startDate: new Date('2026-03-20'),
      endDate: new Date('2026-03-22'),
      reason: 'Attending grandparent\'s anniversary function in another city.',
      status: 'PENDING',
    },
    {
      studentId: students[2 % students.length].id,
      appliedBy: parentUser.id,
      type: 'VACATION',
      startDate: new Date('2026-04-02'),
      endDate: new Date('2026-04-06'),
      reason: 'Family vacation trip planned to hill station.',
      status: 'REJECTED',
      approvedBy: teacher1.id,
      approvedAt: new Date('2026-03-19'),
      remarks: 'Cannot approve during pre-exam period. Please reschedule.',
    },
    {
      studentId: students[3 % students.length].id,
      appliedBy: parentUser.id,
      type: 'SICK',
      startDate: new Date('2026-03-18'),
      endDate: new Date('2026-03-18'),
      reason: 'Dental appointment — tooth extraction scheduled.',
      status: 'APPROVED',
      approvedBy: teacher2.id,
      approvedAt: new Date('2026-03-17'),
    },
    {
      studentId: students[4 % students.length].id,
      appliedBy: parentUser.id,
      type: 'OTHER',
      startDate: new Date('2026-03-25'),
      endDate: new Date('2026-03-25'),
      reason: 'Participating in district-level chess competition.',
      status: 'PENDING',
    },
  ];

  let studentLeaveCount = 0;
  for (const slData of studentLeavesData) {
    const existing = await prisma.studentLeave.findFirst({
      where: {
        studentId: slData.studentId,
        startDate: slData.startDate,
        endDate: slData.endDate,
      },
    });
    if (!existing) {
      await prisma.studentLeave.create({ data: slData as any });
      studentLeaveCount++;
    }
  }
  console.log(`  Created ${studentLeaveCount} student leave applications`);

  // ─── 5. Student Documents (5 for first student) ───────────────────────────────

  console.log('\n--- Seeding 5 Student Documents ---');

  const firstStudent = students[0];

  const studentDocumentsData = [
    {
      studentId: firstStudent.id,
      type: 'BIRTH_CERTIFICATE',
      fileName: 'birth_certificate_2009.pdf',
      fileUrl: 'https://storage.example.com/docs/birth_cert_001.pdf',
      uploadedBy: adminUser.id,
      verified: true,
      verifiedBy: adminUser.id,
      verifiedAt: new Date('2026-01-15'),
      notes: 'Original verified at time of admission.',
    },
    {
      studentId: firstStudent.id,
      type: 'AADHAAR',
      fileName: 'aadhaar_card.jpg',
      fileUrl: 'https://storage.example.com/docs/aadhaar_001.jpg',
      uploadedBy: adminUser.id,
      verified: true,
      verifiedBy: adminUser.id,
      verifiedAt: new Date('2026-01-15'),
    },
    {
      studentId: firstStudent.id,
      type: 'PHOTO',
      fileName: 'passport_photo.jpg',
      fileUrl: 'https://storage.example.com/docs/photo_001.jpg',
      uploadedBy: adminUser.id,
      verified: true,
      verifiedBy: adminUser.id,
      verifiedAt: new Date('2026-01-15'),
    },
    {
      studentId: firstStudent.id,
      type: 'TRANSFER_CERTIFICATE',
      fileName: 'tc_from_previous_school.pdf',
      fileUrl: 'https://storage.example.com/docs/tc_001.pdf',
      uploadedBy: adminUser.id,
      verified: false,
      notes: 'TC from Greenwood Public School. Awaiting verification.',
    },
    {
      studentId: firstStudent.id,
      type: 'MEDICAL',
      fileName: 'medical_fitness_certificate.pdf',
      fileUrl: 'https://storage.example.com/docs/medical_001.pdf',
      uploadedBy: adminUser.id,
      verified: false,
      expiresAt: new Date('2027-01-01'),
      notes: 'Annual medical fitness certificate.',
    },
  ];

  let docCount = 0;
  for (const dData of studentDocumentsData) {
    const existing = await prisma.studentDocument.findFirst({
      where: { studentId: dData.studentId, type: dData.type },
    });
    if (!existing) {
      await prisma.studentDocument.create({ data: dData as any });
      docCount++;
    }
  }
  console.log(`  Created ${docCount} student documents for student ${firstStudent.id}`);

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log('\n=== Seed Extra Complete ===');
  console.log(`  Assignments:              ${assignmentCount}`);
  console.log(`  Teacher attendance:       ${taCount}`);
  console.log(`  Teacher leave apps:       ${leaveAppCount}`);
  console.log(`  Student leave apps:       ${studentLeaveCount}`);
  console.log(`  Student documents:        ${docCount}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
