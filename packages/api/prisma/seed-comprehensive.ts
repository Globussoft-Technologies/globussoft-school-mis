const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getLastWeekdays(n: number): Date[] {
  const days: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (days.length < n) {
    d.setDate(d.getDate() - 1);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) days.push(new Date(d));
  }
  return days;
}

function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  d.setHours(0, 0, 0, 0);
  return d;
}

function today(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('=== Comprehensive Seed Script ===\n');

  // ─── Lookup Core Entities ────────────────────────────────────────────────────

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`School: ${school.name}`);

  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) throw new Error('No active academic session found.');
  console.log(`Session: ${session.name}`);

  const class10 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 10 } });
  const class9 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 9 } });
  const class8 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 8 } });
  if (!class10) throw new Error('Class 10 not found.');
  if (!class9) throw new Error('Class 9 not found.');

  const section10A = await prisma.section.findFirst({ where: { classId: class10.id, name: 'A' } });
  const section9A = await prisma.section.findFirst({ where: { classId: class9.id, name: 'A' } });
  const section9B = await prisma.section.findFirst({ where: { classId: class9.id, name: 'B' } });
  if (!section10A) throw new Error('Section 10A not found.');
  if (!section9A) throw new Error('Section 9A not found.');

  const subjects10 = await prisma.subject.findMany({ where: { classId: class10.id } });
  const subjects9 = await prisma.subject.findMany({ where: { classId: class9.id } });
  const math10 = subjects10.find((s: any) => s.name === 'Mathematics') || subjects10[0];
  const science10 = subjects10.find((s: any) => s.name === 'Science') || subjects10[1] || subjects10[0];
  const english10 = subjects10.find((s: any) => s.name === 'English') || subjects10[2] || subjects10[0];
  const math9 = subjects9.find((s: any) => s.name === 'Mathematics') || subjects9[0];
  const science9 = subjects9.find((s: any) => s.name === 'Science') || subjects9[1] || subjects9[0];

  const teachers = await prisma.user.findMany({
    where: { schoolId: school.id, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER'] } },
    take: 15,
  });
  if (teachers.length === 0) throw new Error('No teachers found.');
  const teacher1 = teachers[0];
  const teacher2 = teachers[1] || teachers[0];
  const teacher3 = teachers[2] || teachers[0];

  const adminUser = await prisma.user.findFirst({ where: { schoolId: school.id, role: 'SUPER_ADMIN' } });
  if (!adminUser) throw new Error('No admin user found.');

  const students10A = await prisma.student.findMany({
    where: { classId: class10.id, sectionId: section10A.id },
    take: 30,
    include: { user: true },
  });
  const students9A = await prisma.student.findMany({
    where: { classId: class9.id, sectionId: section9A.id },
    take: 30,
    include: { user: true },
  });
  const students9B = section9B
    ? await prisma.student.findMany({
        where: { classId: class9.id, sectionId: section9B.id },
        take: 20,
        include: { user: true },
      })
    : [];

  const allStudents9And10 = await prisma.student.findMany({
    where: { class: { grade: { in: [9, 10] } } },
    take: 80,
    include: { user: true },
  });

  console.log(`Teachers: ${teachers.length}, Students 10A: ${students10A.length}, Students 9A: ${students9A.length}`);

  // Get fee heads for payments/defaulters
  const feeHeads = await prisma.feeHead.findMany({ where: { academicSessionId: session.id }, take: 5 });

  // Get existing hobbies
  const hobbies = await prisma.hobby.findMany({ where: { schoolId: school.id } });

  // Get existing question banks
  const questionBanks = await prisma.questionBank.findMany({ take: 10 });

  // Get existing assessments
  const assessments10 = await prisma.assessment.findMany({ where: { classId: class10.id }, take: 10 });

  // Get routes and stops for bus
  const routes = await prisma.route.findMany({ where: { schoolId: school.id }, include: { stops: true } });

  const summaryMap: Record<string, number> = {};

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 1 — More Foundation Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 1: Foundation Data ===');

  // 1a. Admission Enquiries (10 more)
  try {
    const enquiryStatuses = ['ENQUIRY', 'FOLLOW_UP', 'SCHEDULED', 'VISITED', 'CONVERTED', 'DROPPED'];
    const enquirySources = ['WALK_IN', 'WEBSITE', 'REFERRAL', 'ADVERTISEMENT'];
    const classNames = ['Class 1', 'Class 2', 'Class 3', 'Class 4', 'Class 5', 'Class 6', 'Class 7', 'Class 8'];

    const enquiriesData = [
      { studentName: 'Aarav Mehta', parentName: 'Rajesh Mehta', parentPhone: '9810001001', parentEmail: 'rajesh.mehta@gmail.com', classAppliedFor: 'Class 6', status: 'ENQUIRY', source: 'WALK_IN', notes: 'Parent visited the campus and enquired about admission for next year.' },
      { studentName: 'Priya Sharma', parentName: 'Sunita Sharma', parentPhone: '9810001002', parentEmail: 'sunita.sharma@yahoo.com', classAppliedFor: 'Class 3', status: 'FOLLOW_UP', source: 'WEBSITE', notes: 'Applied through website. Follow-up call scheduled for Monday.' },
      { studentName: 'Ravi Kumar', parentName: 'Anil Kumar', parentPhone: '9810001003', classAppliedFor: 'Class 8', status: 'SCHEDULED', source: 'REFERRAL', notes: 'Referred by existing student Akash Kumar. Interview scheduled.' },
      { studentName: 'Ananya Singh', parentName: 'Pankaj Singh', parentPhone: '9810001004', parentEmail: 'pankaj.singh@gmail.com', classAppliedFor: 'Class 5', status: 'VISITED', source: 'ADVERTISEMENT', notes: 'Visited campus. Impressed with facilities. Awaiting decision.' },
      { studentName: 'Karan Gupta', parentName: 'Vivek Gupta', parentPhone: '9810001005', classAppliedFor: 'Class 1', status: 'CONVERTED', source: 'REFERRAL', notes: 'Admitted. Admission form completed and fees paid.' },
      { studentName: 'Sneha Patel', parentName: 'Hemant Patel', parentPhone: '9810001006', parentEmail: 'hemant.patel@gmail.com', classAppliedFor: 'Class 7', status: 'ENQUIRY', source: 'WALK_IN', notes: 'Enquiry made. Information brochure shared.' },
      { studentName: 'Arjun Verma', parentName: 'Sanjay Verma', parentPhone: '9810001007', classAppliedFor: 'Class 4', status: 'DROPPED', source: 'WEBSITE', notes: 'Parent decided to enroll in another school closer to home.' },
      { studentName: 'Pooja Iyer', parentName: 'Krishnan Iyer', parentPhone: '9810001008', parentEmail: 'krishnan.iyer@hotmail.com', classAppliedFor: 'Class 2', status: 'FOLLOW_UP', source: 'REFERRAL', notes: 'Strong reference from teacher. Second follow-up call done.' },
      { studentName: 'Vikram Joshi', parentName: 'Pratap Joshi', parentPhone: '9810001009', classAppliedFor: 'Class 9', status: 'SCHEDULED', source: 'WALK_IN', notes: 'Mid-year transfer. Entrance test scheduled for Friday.' },
      { studentName: 'Meera Nair', parentName: 'Suresh Nair', parentPhone: '9810001010', parentEmail: 'suresh.nair@gmail.com', classAppliedFor: 'Class 6', status: 'VISITED', source: 'ADVERTISEMENT', notes: 'Attended open house event. Very interested in sports program.' },
    ];

    let count = 0;
    for (const data of enquiriesData) {
      const exists = await prisma.admissionEnquiry.findFirst({ where: { parentPhone: data.parentPhone } });
      if (!exists) {
        await prisma.admissionEnquiry.create({ data: { ...data, academicSessionId: session.id } });
        count++;
      }
    }
    summaryMap['enquiries'] = count;
    console.log(`  Admission enquiries: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Enquiries failed:', e.message);
  }

  // 1b. Admission Applications (5)
  try {
    const applicationsData = [
      { formNumber: 'APP-2026-0101', studentFirstName: 'Karan', studentLastName: 'Gupta', dateOfBirth: new Date('2020-04-15'), gender: 'MALE', classAppliedFor: 'Class 1', previousSchool: null, city: 'Delhi', state: 'Delhi', pincode: '110001', status: 'ADMITTED', academicSessionId: session.id },
      { formNumber: 'APP-2026-0102', studentFirstName: 'Ananya', studentLastName: 'Singh', dateOfBirth: new Date('2016-07-22'), gender: 'FEMALE', classAppliedFor: 'Class 5', previousSchool: 'Sunrise Academy', city: 'Delhi', state: 'Delhi', pincode: '110005', status: 'DOCUMENT_VERIFICATION', academicSessionId: session.id },
      { formNumber: 'APP-2026-0103', studentFirstName: 'Vikram', studentLastName: 'Joshi', dateOfBirth: new Date('2011-11-08'), gender: 'MALE', classAppliedFor: 'Class 9', previousSchool: 'St. Marys High School', city: 'Noida', state: 'UP', pincode: '201301', status: 'ENTRANCE_TEST', academicSessionId: session.id },
      { formNumber: 'APP-2026-0104', studentFirstName: 'Priya', studentLastName: 'Sharma', dateOfBirth: new Date('2018-02-14'), gender: 'FEMALE', classAppliedFor: 'Class 3', previousSchool: 'Little Stars School', city: 'Gurgaon', state: 'Haryana', pincode: '122001', status: 'INTERVIEW', academicSessionId: session.id },
      { formNumber: 'APP-2026-0105', studentFirstName: 'Meera', studentLastName: 'Nair', dateOfBirth: new Date('2015-09-30'), gender: 'FEMALE', classAppliedFor: 'Class 6', previousSchool: 'Kerala Vidyalaya', city: 'Delhi', state: 'Delhi', pincode: '110003', status: 'FEES_PENDING', academicSessionId: session.id },
    ];

    // Find enquiry IDs to link
    const enquiries = await prisma.admissionEnquiry.findMany({ where: { academicSessionId: session.id }, take: 10 });

    let count = 0;
    for (let i = 0; i < applicationsData.length; i++) {
      const data = applicationsData[i];
      const exists = await prisma.admissionApplication.findFirst({ where: { formNumber: data.formNumber } });
      if (!exists) {
        const enquiry = enquiries[i] || enquiries[0];
        if (enquiry) {
          await prisma.admissionApplication.create({ data: { ...data, enquiryId: enquiry.id } });
          count++;
        }
      }
    }
    summaryMap['applications'] = count;
    console.log(`  Admission applications: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Applications failed:', e.message);
  }

  // 1c. Attendance for Class 9A and 9B (last 5 weekdays)
  try {
    const weekdays = getLastWeekdays(5);
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE', 'PRESENT', 'PRESENT'];
    let count = 0;

    const studentsForAttendance = [...students9A, ...students9B];
    for (const student of studentsForAttendance) {
      for (let i = 0; i < weekdays.length; i++) {
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        try {
          await prisma.attendance.upsert({
            where: { studentId_date: { studentId: student.id, date: weekdays[i] } },
            update: {},
            create: {
              studentId: student.id,
              date: weekdays[i],
              status,
              markedById: teacher1.id,
              remarks: status === 'LATE' ? 'Arrived after roll call' : undefined,
            },
          });
          count++;
        } catch {}
      }
    }
    summaryMap['attendance9'] = count;
    console.log(`  Class 9 attendance records: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Class 9 attendance failed:', e.message);
  }

  // 1d. Timetable for Class 9A
  try {
    const existing9ATT = await prisma.timetable.findFirst({ where: { classId: class9.id, sectionId: section9A.id, academicSessionId: session.id } });
    let ttId: string;
    if (!existing9ATT) {
      const tt = await prisma.timetable.create({
        data: {
          classId: class9.id,
          sectionId: section9A.id,
          academicSessionId: session.id,
          effectiveFrom: new Date('2026-01-01'),
        },
      });
      ttId = tt.id;
    } else {
      ttId = existing9ATT.id;
    }

    // Mon-Fri (1-5), 7 periods per day
    const periods = [
      { start: '08:00', end: '08:45' },
      { start: '08:45', end: '09:30' },
      { start: '09:30', end: '10:15' },
      { start: '10:15', end: '10:30', type: 'BREAK' },
      { start: '10:30', end: '11:15' },
      { start: '11:15', end: '12:00' },
      { start: '12:00', end: '12:45' },
      { start: '12:45', end: '13:15', type: 'BREAK' },
      { start: '13:15', end: '14:00' },
    ];

    const subjectCycle = subjects9.length > 0 ? subjects9 : [math9, science9].filter(Boolean);
    let slotCount = 0;
    for (let day = 1; day <= 5; day++) {
      for (let pi = 0; pi < periods.length; pi++) {
        const p = periods[pi];
        const isBreak = p.type === 'BREAK';
        const subject = isBreak ? null : subjectCycle[pi % subjectCycle.length];
        const teacher = isBreak ? null : teachers[pi % teachers.length];
        const existing = await prisma.timetableSlot.findFirst({
          where: { timetableId: ttId, dayOfWeek: day, startTime: p.start },
        });
        if (!existing) {
          await prisma.timetableSlot.create({
            data: {
              timetableId: ttId,
              dayOfWeek: day,
              startTime: p.start,
              endTime: p.end,
              subjectId: subject?.id || null,
              teacherId: teacher?.id || null,
              room: isBreak ? null : `Room 9${String.fromCharCode(64 + day)}`,
              type: isBreak ? 'BREAK' : 'LECTURE',
            },
          });
          slotCount++;
        }
      }
    }
    summaryMap['timetable9A'] = slotCount;
    console.log(`  Class 9A timetable slots: +${slotCount}`);
  } catch (e: any) {
    console.error('  [WARN] Timetable 9A failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2 — Academic Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 2: Academic Data ===');

  // 2a. LMS Content (10 more, mixed classes/subjects)
  try {
    const lmsItems = [
      { title: 'Newton\'s Laws of Motion - Video Lecture', type: 'VIDEO', subjectId: science9.id, classId: class9.id, description: 'Detailed explanation of all three Newton\'s Laws with real-world examples.', duration: 42, isPublished: true },
      { title: 'Algebra Basics - Interactive Worksheet', type: 'INTERACTIVE', subjectId: math9.id, classId: class9.id, description: 'Practice problems on algebraic expressions, equations, and identities.', isPublished: true },
      { title: 'Photosynthesis Process - Presentation', type: 'PRESENTATION', subjectId: science9.id, classId: class9.id, description: 'Step-by-step slides explaining the light and dark reactions of photosynthesis.', isPublished: true },
      { title: 'Quadratic Formula Proof - Video', type: 'VIDEO', subjectId: math10.id, classId: class10.id, description: 'Derivation of the quadratic formula from completing the square method.', duration: 28, isPublished: true },
      { title: 'Periodic Table Notes - Document', type: 'DOCUMENT', subjectId: science10.id, classId: class10.id, description: 'Comprehensive notes on the periodic table, trends, and element properties.', isPublished: true },
      { title: 'Coordinate Geometry - Study Material', type: 'DOCUMENT', subjectId: math9.id, classId: class9.id, description: 'Notes covering distance formula, section formula, and area of triangle.', isPublished: false },
      { title: 'Life Processes - Video Series (Part 1)', type: 'VIDEO', subjectId: science10.id, classId: class10.id, description: 'Video on nutrition, respiration, and transportation in living organisms.', duration: 55, isPublished: true },
      { title: 'Polynomial Division - Tutorial Link', type: 'LINK', subjectId: math10.id, classId: class10.id, description: 'External Khan Academy link for polynomial long division.', externalUrl: 'https://www.khanacademy.org/math/algebra2/x2ec2f6f830c9fb89:poly-div', isPublished: true },
      { title: 'Chemical Bonding - Audio Notes', type: 'AUDIO', subjectId: science9.id, classId: class9.id, description: 'Audio summary of ionic, covalent, and metallic bonding.', duration: 18, isPublished: true },
      { title: 'Statistics Revision - Presentation', type: 'PRESENTATION', subjectId: math10.id, classId: class10.id, description: 'Quick revision slides for mean, median, mode, and standard deviation.', isPublished: true },
    ];

    let count = 0;
    for (const item of lmsItems) {
      const exists = await prisma.lmsContent.findFirst({ where: { title: item.title, classId: item.classId } });
      if (!exists) {
        await prisma.lmsContent.create({
          data: {
            title: item.title,
            type: item.type,
            subjectId: item.subjectId,
            classId: item.classId,
            description: item.description,
            duration: (item as any).duration,
            externalUrl: (item as any).externalUrl || null,
            fileUrl: (item as any).externalUrl ? null : `https://storage.example.com/lms/${item.type.toLowerCase()}_${Date.now()}_${count}.pdf`,
            uploadedBy: teacher1.id,
            isPublished: item.isPublished,
            tags: JSON.stringify([item.type.toLowerCase(), 'academic']),
            sortOrder: count,
          },
        });
        count++;
      }
    }
    summaryMap['lmsContent'] = count;
    console.log(`  LMS content items: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] LMS content failed:', e.message);
  }

  // 2b. Assessments for Class 9 (5 more)
  try {
    const assessmentsData = [
      { title: 'Class 9 Mathematics — Chapter 1 Unit Test', type: 'UNIT_TEST', tier: 3, subjectId: math9.id, classId: class9.id, totalMarks: 25, passingMarks: 10, duration: 60, scheduledDate: daysFromNow(7), isPublished: true, instructions: 'All questions are compulsory. Show all workings.' },
      { title: 'Class 9 Science — Mid-Term Examination', type: 'MID_TERM', tier: 5, subjectId: science9.id, classId: class9.id, totalMarks: 80, passingMarks: 32, duration: 180, scheduledDate: daysFromNow(14), isPublished: true, instructions: 'Bring geometry box and scientific calculator.' },
      { title: 'Class 9 Mathematics — Polynomials Quiz', type: 'QUIZ', tier: 2, subjectId: math9.id, classId: class9.id, totalMarks: 10, passingMarks: 4, duration: 20, scheduledDate: daysFromNow(3), isPublished: true, instructions: 'No calculators allowed.' },
      { title: 'Class 9 Science — Chemistry Practical Test', type: 'PRACTICAL', tier: 6, subjectId: science9.id, classId: class9.id, totalMarks: 30, passingMarks: 12, duration: 90, scheduledDate: daysFromNow(10), isPublished: false, instructions: 'Lab coats and safety goggles mandatory.' },
      { title: 'Class 9 Mathematics — Algebra Classwork', type: 'CLASSWORK', tier: 1, subjectId: math9.id, classId: class9.id, totalMarks: 10, passingMarks: 4, duration: 30, scheduledDate: today(), isPublished: true, instructions: 'Complete all problems in the given time.' },
    ];

    let count = 0;
    for (const data of assessmentsData) {
      const exists = await prisma.assessment.findFirst({ where: { title: data.title, classId: class9.id } });
      if (!exists) {
        await prisma.assessment.create({
          data: { ...data, academicSessionId: session.id, createdBy: teacher1.id },
        });
        count++;
      }
    }
    summaryMap['assessments9'] = count;
    console.log(`  Class 9 assessments: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Assessments for Class 9 failed:', e.message);
  }

  // 2c. Question bank questions (20 more across existing banks)
  try {
    let count = 0;
    if (questionBanks.length > 0) {
      const questions9Math = [
        { text: 'Which of the following is a polynomial?', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: 'x² + 1/x', isCorrect: false }, { id: 'b', text: '√x + 1', isCorrect: false }, { id: 'c', text: 'x³ - 2x + 5', isCorrect: true }, { id: 'd', text: 'x^(-2) + 3', isCorrect: false }]), marks: 1, difficultyLevel: 'EASY' },
        { text: 'The degree of the polynomial 3x⁴ - 5x² + 2x - 1 is:', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: '1', isCorrect: false }, { id: 'b', text: '2', isCorrect: false }, { id: 'c', text: '3', isCorrect: false }, { id: 'd', text: '4', isCorrect: true }]), marks: 1, difficultyLevel: 'EASY' },
        { text: 'If p(x) = x² - 3x + 2, find p(1).', type: 'SHORT_ANSWER', correctAnswer: '0', marks: 2, difficultyLevel: 'EASY' },
        { text: 'State and prove the Factor Theorem.', type: 'LONG_ANSWER', correctAnswer: 'If p(a) = 0, then (x-a) is a factor of p(x).', marks: 5, difficultyLevel: 'HARD' },
        { text: 'Every real number is a rational number. (True/False)', type: 'TRUE_FALSE', correctAnswer: 'FALSE', marks: 1, difficultyLevel: 'EASY' },
        { text: 'The product of (x+a)(x+b) = x² + _____x + ab', type: 'FILL_BLANK', correctAnswer: '(a+b)', marks: 1, difficultyLevel: 'MEDIUM' },
        { text: 'Expand (2x + 3y)² using algebraic identity.', type: 'SHORT_ANSWER', correctAnswer: '4x² + 12xy + 9y²', marks: 3, difficultyLevel: 'MEDIUM' },
        { text: 'Find the zeros of the polynomial x² - 5x + 6.', type: 'SHORT_ANSWER', correctAnswer: 'x = 2 and x = 3', marks: 4, difficultyLevel: 'MEDIUM' },
        { text: 'In a linear equation ax + b = 0, which condition gives no solution?', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: 'a ≠ 0', isCorrect: false }, { id: 'b', text: 'a = 0, b ≠ 0', isCorrect: true }, { id: 'c', text: 'a = 0, b = 0', isCorrect: false }, { id: 'd', text: 'b = 0', isCorrect: false }]), marks: 2, difficultyLevel: 'MEDIUM' },
        { text: 'A linear equation in two variables has how many solutions?', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: 'Exactly one', isCorrect: false }, { id: 'b', text: 'No solution', isCorrect: false }, { id: 'c', text: 'Infinitely many', isCorrect: true }, { id: 'd', text: 'Two', isCorrect: false }]), marks: 1, difficultyLevel: 'EASY' },
      ];
      const questions9Science = [
        { text: 'The speed of light in vacuum is approximately:', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: '3×10⁶ m/s', isCorrect: false }, { id: 'b', text: '3×10⁸ m/s', isCorrect: true }, { id: 'c', text: '3×10¹⁰ m/s', isCorrect: false }, { id: 'd', text: '3×10⁴ m/s', isCorrect: false }]), marks: 1, difficultyLevel: 'EASY' },
        { text: 'Which organelle is known as the powerhouse of the cell?', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: 'Nucleus', isCorrect: false }, { id: 'b', text: 'Ribosome', isCorrect: false }, { id: 'c', text: 'Mitochondria', isCorrect: true }, { id: 'd', text: 'Golgi Apparatus', isCorrect: false }]), marks: 1, difficultyLevel: 'EASY' },
        { text: 'Define force. State its SI unit.', type: 'SHORT_ANSWER', correctAnswer: 'Force is a push or pull. SI unit is Newton (N).', marks: 2, difficultyLevel: 'EASY' },
        { text: 'Explain Newton\'s Second Law of Motion with an example.', type: 'LONG_ANSWER', marks: 5, difficultyLevel: 'MEDIUM' },
        { text: 'Photosynthesis takes place in chloroplasts. (True/False)', type: 'TRUE_FALSE', correctAnswer: 'TRUE', marks: 1, difficultyLevel: 'EASY' },
        { text: 'The chemical formula for water is _____', type: 'FILL_BLANK', correctAnswer: 'H₂O', marks: 1, difficultyLevel: 'EASY' },
        { text: 'What is the difference between speed and velocity?', type: 'SHORT_ANSWER', correctAnswer: 'Speed is scalar (magnitude only), velocity is vector (magnitude + direction).', marks: 3, difficultyLevel: 'MEDIUM' },
        { text: 'Classify the following: NaCl, HCl, NaOH, H₂SO₄ as acids/bases/salts.', type: 'LONG_ANSWER', marks: 4, difficultyLevel: 'MEDIUM' },
        { text: 'Which gas is produced during photosynthesis?', type: 'MCQ', options: JSON.stringify([{ id: 'a', text: 'CO₂', isCorrect: false }, { id: 'b', text: 'N₂', isCorrect: false }, { id: 'c', text: 'O₂', isCorrect: true }, { id: 'd', text: 'H₂', isCorrect: false }]), marks: 1, difficultyLevel: 'EASY' },
        { text: 'Calculate the work done when a force of 10N moves an object 5m in the direction of force.', type: 'SHORT_ANSWER', correctAnswer: '50 J (Joules)', marks: 3, difficultyLevel: 'MEDIUM' },
      ];

      const allNewQuestions = [...questions9Math, ...questions9Science];
      for (let i = 0; i < allNewQuestions.length; i++) {
        const bank = questionBanks[i % questionBanks.length];
        await prisma.question.create({
          data: {
            bankId: bank.id,
            ...allNewQuestions[i],
            tags: JSON.stringify(['class9', 'revision']),
          },
        });
        count++;
      }
    }
    summaryMap['questions'] = count;
    console.log(`  Questions added: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Questions failed:', e.message);
  }

  // 2d. Grade entries (30 more across Class 9 and 10)
  try {
    let count = 0;
    const gradeLabels = ['A+', 'A', 'B+', 'B', 'C', 'D'];
    const gradeTypes = ['ASSESSMENT', 'CLASSWORK', 'PARTICIPATION'];

    const studentsForGrades = allStudents9And10.slice(0, 20);
    const subjectsForGrades = [math9, science9, math10, science10].filter(Boolean);

    for (const student of studentsForGrades) {
      if (count >= 30) break;
      const subj = subjectsForGrades[count % subjectsForGrades.length];
      if (!subj) continue;
      // Check if student belongs to the subject's class
      if (student.classId !== subj.classId) continue;

      const maxMarks = 100;
      const obtained = Math.floor(Math.random() * 40) + 55; // 55-95
      const percentage = (obtained / maxMarks) * 100;
      const label = percentage >= 90 ? 'A+' : percentage >= 80 ? 'A' : percentage >= 70 ? 'B+' : percentage >= 60 ? 'B' : 'C';

      try {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: subj.id,
            type: gradeTypes[count % gradeTypes.length],
            marksObtained: obtained,
            maxMarks,
            percentage,
            gradeLabel: label,
            gradedBy: teacher1.id,
            remarks: `Term 1 ${gradeTypes[count % gradeTypes.length].toLowerCase()} grade`,
          },
        });
        count++;
      } catch {}
    }

    // Add remaining grades spread across more students
    for (const student of allStudents9And10) {
      if (count >= 30) break;
      const subj = subjectsForGrades[count % subjectsForGrades.length];
      if (!subj || student.classId !== subj.classId) continue;

      const obtained = Math.floor(Math.random() * 40) + 50;
      try {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: subj.id,
            type: 'CLASSWORK',
            marksObtained: obtained,
            maxMarks: 100,
            percentage: obtained,
            gradeLabel: obtained >= 80 ? 'A' : obtained >= 60 ? 'B' : 'C',
            gradedBy: teacher2.id,
          },
        });
        count++;
      } catch {}
    }
    summaryMap['grades'] = count;
    console.log(`  Grade entries: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Grades failed:', e.message);
  }

  // 2e. Assignments with submissions (5 assignments × 10 submissions each)
  try {
    let assignCount = 0;
    let subCount = 0;
    const assignmentSubjects = [math9, science9, math10, science10, english10].filter(Boolean);
    const assignmentClasses = [class9, class9, class10, class10, class10];
    const assignmentSections = [section9A, section9A, section10A, section10A, section10A];
    const submissionStatuses = ['SUBMITTED', 'GRADED', 'RETURNED', 'SUBMITTED', 'GRADED'];

    for (let ai = 0; ai < 5; ai++) {
      const subj = assignmentSubjects[ai];
      const cls = assignmentClasses[ai];
      const sec = assignmentSections[ai];
      if (!subj || !cls || !sec) continue;

      const title = `${subj.name} Assignment ${ai + 1} — Term Assessment`;
      let assignment = await prisma.assignment.findFirst({ where: { title, classId: cls.id, academicSessionId: session.id } });
      if (!assignment) {
        assignment = await prisma.assignment.create({
          data: {
            title,
            instructions: `Complete all questions for ${subj.name}. Show all working clearly.`,
            type: ai % 2 === 0 ? 'FILE_SUBMISSION' : 'TEXT_RESPONSE',
            subjectId: subj.id,
            classId: cls.id,
            sectionId: sec.id,
            teacherId: teachers[ai % teachers.length].id,
            dueDate: daysFromNow(ai + 3),
            totalMarks: 20 + ai * 5,
            isPublished: true,
            allowLate: ai % 2 === 0,
            academicSessionId: session.id,
          },
        });
        assignCount++;
      }

      // 10 submissions per assignment
      const classStudents = cls.id === class9.id ? students9A : students10A;
      let submissionsCreated = 0;
      for (const student of classStudents) {
        if (submissionsCreated >= 10) break;
        const status = submissionStatuses[submissionsCreated % submissionStatuses.length];
        try {
          await prisma.assignmentSubmission.upsert({
            where: { assignmentId_studentId: { assignmentId: assignment.id, studentId: student.id } },
            update: {},
            create: {
              assignmentId: assignment.id,
              studentId: student.id,
              content: `Student answer for ${subj.name} assignment. Detailed solution provided.`,
              status,
              submittedAt: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000),
              marksAwarded: status === 'GRADED' ? Math.floor(Math.random() * 15) + 8 : null,
              feedback: status === 'GRADED' ? 'Good effort. Need to improve working details.' : null,
              gradedBy: status === 'GRADED' ? teacher1.id : null,
              gradedAt: status === 'GRADED' ? new Date() : null,
            },
          });
          submissionsCreated++;
          subCount++;
        } catch {}
      }
    }
    summaryMap['assignments'] = assignCount;
    summaryMap['submissions'] = subCount;
    console.log(`  New assignments: +${assignCount}, Submissions: +${subCount}`);
  } catch (e: any) {
    console.error('  [WARN] Assignments/Submissions failed:', e.message);
  }

  // 2f. Report Cards for Class 10A students (3, TERM_1)
  try {
    let count = 0;
    const rcStudents = students10A.slice(0, 3);
    for (let i = 0; i < rcStudents.length; i++) {
      const student = rcStudents[i];
      const exists = await prisma.reportCard.findFirst({
        where: { studentId: student.id, academicSessionId: session.id, term: 'TERM_1' },
      });
      if (!exists) {
        const rc = await prisma.reportCard.create({
          data: {
            studentId: student.id,
            classId: class10.id,
            academicSessionId: session.id,
            term: 'TERM_1',
            overallPercentage: 72 + i * 5,
            overallGrade: i === 0 ? 'B+' : i === 1 ? 'A' : 'A+',
            rank: i + 1,
            totalStudents: students10A.length,
            teacherRemarks: `${student.user?.firstName} has shown consistent progress this term.`,
            principalRemarks: 'Keep up the good work. Aim for excellence.',
            issuedBy: adminUser.id,
            issuedAt: new Date(),
            status: 'APPROVED',
          },
        });

        // Add subject results
        for (const subj of subjects10.slice(0, 5)) {
          const marks = Math.floor(Math.random() * 25) + 60;
          await prisma.subjectResult.create({
            data: {
              reportCardId: rc.id,
              subjectName: subj.name,
              maxMarks: 100,
              obtained: marks,
              grade: marks >= 90 ? 'A+' : marks >= 80 ? 'A' : marks >= 70 ? 'B+' : 'B',
              teacherNote: 'Satisfactory performance.',
            },
          });
        }
        count++;
      }
    }
    summaryMap['reportCards'] = count;
    console.log(`  Report cards: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Report cards failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3 — Operations Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 3: Operations Data ===');

  // 3a. Payments (10 more, different students/methods)
  try {
    let count = 0;
    if (feeHeads.length > 0) {
      const methods = ['CASH', 'ONLINE', 'CHEQUE', 'UPI'];
      const paymentStudents = allStudents9And10.slice(5, 15);

      for (let i = 0; i < Math.min(10, paymentStudents.length); i++) {
        const student = paymentStudents[i];
        const feeHead = feeHeads[i % feeHeads.length];
        const method = methods[i % methods.length];
        const amount = feeHead.amount;
        const receiptNo = `RCP-2026-${String(9000 + i).padStart(5, '0')}`;

        const exists = await prisma.payment.findFirst({ where: { receiptNo } });
        if (!exists) {
          await prisma.payment.create({
            data: {
              studentId: student.id,
              feeHeadId: feeHead.id,
              amount,
              paidAmount: amount,
              method,
              receiptNo,
              transactionId: method === 'ONLINE' || method === 'UPI' ? `TXN${Date.now()}${i}` : null,
              status: 'PAID',
              paidAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
              receivedBy: adminUser.id,
            },
          });
          count++;
        }
      }
    }
    summaryMap['payments'] = count;
    console.log(`  Payments: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Payments failed:', e.message);
  }

  // 3b. Discipline incidents (5 for different students)
  try {
    let count = 0;
    const incidentTypes = ['MISCONDUCT', 'BULLYING', 'UNIFORM_VIOLATION', 'MOBILE_USE', 'CHEATING'];
    const severities = ['MINOR', 'MODERATE', 'MINOR', 'MINOR', 'SERIOUS'];
    const descriptions = [
      'Student was disruptive in class, repeatedly talking during lesson and ignoring teacher instructions.',
      'Student was found bullying a junior student in the corridor during break time.',
      'Student came to school without proper uniform three consecutive days.',
      'Mobile phone found and confiscated during examination. Using phone during exam period.',
      'Student was found copying from another student\'s answer sheet during the mathematics test.',
    ];

    const incidentStudents = allStudents9And10.slice(10, 20);
    for (let i = 0; i < 5 && i < incidentStudents.length; i++) {
      const student = incidentStudents[i];
      const exists = await prisma.incident.findFirst({ where: { studentId: student.id, type: incidentTypes[i] } });
      if (!exists) {
        const incident = await prisma.incident.create({
          data: {
            studentId: student.id,
            reportedBy: teacher1.id,
            date: daysFromNow(-i - 2),
            time: `${9 + i}:30`,
            type: incidentTypes[i],
            severity: severities[i],
            description: descriptions[i],
            witnesses: JSON.stringify([]),
            location: i % 2 === 0 ? 'Classroom' : 'Corridor',
            status: i < 2 ? 'UNDER_REVIEW' : 'REPORTED',
          },
        });

        // Add disciplinary action
        await prisma.disciplinaryAction.create({
          data: {
            incidentId: incident.id,
            actionType: severities[i] === 'SERIOUS' ? 'PARENT_MEETING' : 'WARNING',
            assignedBy: adminUser.id,
            description: severities[i] === 'SERIOUS' ? 'Parent meeting arranged for next week.' : 'Verbal warning issued.',
            parentNotified: i < 3,
            status: 'PENDING',
          },
        });
        count++;
      }
    }
    summaryMap['incidents'] = count;
    console.log(`  Incidents: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Incidents failed:', e.message);
  }

  // 3c. Bus boarding logs (5 for today)
  try {
    let count = 0;
    if (routes.length > 0) {
      const route = routes[0];
      const stops = route.stops;
      if (stops.length > 0) {
        // Find students with bus assignments
        const busStudents = await prisma.student.findMany({
          where: { busAssignment: { isNot: null } },
          take: 5,
          include: { busAssignment: true },
        });

        for (const student of busStudents) {
          const stop = stops[0];
          const todayDate = today();
          const exists = await prisma.boardingLog.findFirst({
            where: { studentId: student.id, date: todayDate, type: 'MORNING' },
          });
          if (!exists) {
            await prisma.boardingLog.create({
              data: {
                studentId: student.id,
                routeId: route.id,
                stopId: stop.id,
                date: todayDate,
                boardingTime: new Date(),
                type: 'MORNING',
                status: 'BOARDED',
                conductorId: null,
              },
            });
            count++;
          }
        }

        // If not enough bus students, use allStudents9And10
        if (count < 5) {
          for (const student of allStudents9And10) {
            if (count >= 5) break;
            const stop = stops[0];
            const todayDate = today();
            try {
              await prisma.boardingLog.create({
                data: {
                  studentId: student.id,
                  routeId: route.id,
                  stopId: stop.id,
                  date: todayDate,
                  boardingTime: new Date(),
                  type: 'MORNING',
                  status: 'BOARDED',
                },
              });
              count++;
            } catch {}
          }
        }
      }
    }
    summaryMap['boardingLogs'] = count;
    console.log(`  Bus boarding logs: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Bus boarding logs failed:', e.message);
  }

  // 3d. Defaulter records (3 more)
  try {
    let count = 0;
    if (feeHeads.length > 0) {
      const defaulterStudents = allStudents9And10.slice(20, 25);
      for (let i = 0; i < 3 && i < defaulterStudents.length; i++) {
        const student = defaulterStudents[i];
        const feeHead = feeHeads[i % feeHeads.length];
        const exists = await prisma.defaulterRecord.findFirst({ where: { studentId: student.id, feeHeadId: feeHead.id } });
        if (!exists) {
          await prisma.defaulterRecord.create({
            data: {
              studentId: student.id,
              feeHeadId: feeHead.id,
              amountDue: feeHead.amount,
              dueDate: daysFromNow(-30 + i * 10),
              callAttempts: i + 1,
              lastCallAt: i > 0 ? new Date(Date.now() - i * 3 * 24 * 60 * 60 * 1000) : null,
              lastCallStatus: i > 0 ? 'NO_ANSWER' : null,
              smsSent: i,
              status: i === 2 ? 'ESCALATED' : 'ACTIVE',
            },
          });
          count++;
        }
      }
    }
    summaryMap['defaulters'] = count;
    console.log(`  Defaulter records: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Defaulters failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4 — Enrichment Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 4: Enrichment Data ===');

  // 4a. Hobby enrollments (10 more)
  try {
    let count = 0;
    if (hobbies.length > 0) {
      const hobbyStudents = allStudents9And10.slice(0, 15);
      for (let i = 0; i < hobbyStudents.length && count < 10; i++) {
        const student = hobbyStudents[i];
        const hobby = hobbies[i % hobbies.length];
        const exists = await prisma.hobbyEnrollment.findFirst({ where: { studentId: student.id, hobbyId: hobby.id, academicSessionId: session.id } });
        if (!exists) {
          await prisma.hobbyEnrollment.create({
            data: {
              studentId: student.id,
              hobbyId: hobby.id,
              academicSessionId: session.id,
              status: 'ENROLLED',
              level: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'][i % 3],
            },
          });
          count++;
        }
      }
    }
    summaryMap['hobbyEnrollments'] = count;
    console.log(`  Hobby enrollments: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Hobby enrollments failed:', e.message);
  }

  // 4b. Hobby sessions with attendance (5 sessions)
  try {
    let sessionCount = 0;
    let attendanceCount = 0;
    if (hobbies.length > 0) {
      const activities = [
        'Basic sketching techniques — contour drawing',
        'Introduction to watercolor painting',
        'Football drills — passing and dribbling',
        'Coding basics — introduction to Python',
        'Creative writing workshop — descriptive paragraphs',
      ];

      for (let si = 0; si < 5 && si < hobbies.length; si++) {
        const hobby = hobbies[si];
        const sessionDate = daysFromNow(-(si + 1));

        const hs = await prisma.hobbySession.create({
          data: {
            hobbyId: hobby.id,
            date: sessionDate,
            startTime: '14:00',
            endTime: '15:30',
            activity: activities[si],
            materials: 'Provided by school',
            notes: 'Session went well. Students were engaged.',
            conductedBy: teachers[si % teachers.length].id,
          },
        });
        sessionCount++;

        // Add attendance for enrolled students
        const enrollments = await prisma.hobbyEnrollment.findMany({ where: { hobbyId: hobby.id, academicSessionId: session.id }, take: 5 });
        for (const enrollment of enrollments) {
          try {
            await prisma.hobbyAttendance.upsert({
              where: { sessionId_studentId: { sessionId: hs.id, studentId: enrollment.studentId } },
              update: {},
              create: {
                sessionId: hs.id,
                studentId: enrollment.studentId,
                status: Math.random() > 0.2 ? 'PRESENT' : 'ABSENT',
              },
            });
            attendanceCount++;
          } catch {}
        }
      }
    }
    summaryMap['hobbySessions'] = sessionCount;
    summaryMap['hobbyAttendance'] = attendanceCount;
    console.log(`  Hobby sessions: +${sessionCount}, attendance: +${attendanceCount}`);
  } catch (e: any) {
    console.error('  [WARN] Hobby sessions failed:', e.message);
  }

  // 4c. PTM bookings (3, BOOKED)
  try {
    let count = 0;
    const ptmDate = daysFromNow(7);

    // Create PTM slots first
    const ptmSlotData = [
      { startTime: '09:00', endTime: '09:20' },
      { startTime: '09:20', endTime: '09:40' },
      { startTime: '09:40', endTime: '10:00' },
    ];

    const parentUsers = await prisma.user.findMany({ where: { schoolId: school.id, role: 'PARENT' }, take: 3 });
    const parentUser = parentUsers[0] || adminUser;

    for (let i = 0; i < 3; i++) {
      const ptmTeacher = teachers[i % teachers.length];
      let slot = await prisma.pTMSlot.findFirst({
        where: { teacherId: ptmTeacher.id, date: ptmDate, startTime: ptmSlotData[i].startTime },
      });
      if (!slot) {
        slot = await prisma.pTMSlot.create({
          data: {
            date: ptmDate,
            startTime: ptmSlotData[i].startTime,
            endTime: ptmSlotData[i].endTime,
            teacherId: ptmTeacher.id,
            classId: class10.id,
            maxBookings: 1,
            bookedCount: 1,
            academicSessionId: session.id,
          },
        });
      }

      const student = students10A[i] || students10A[0];
      const parent = parentUsers[i] || parentUser;
      const existsBooking = await prisma.pTMBooking.findFirst({ where: { slotId: slot.id, studentId: student.id } });
      if (!existsBooking) {
        await prisma.pTMBooking.create({
          data: {
            slotId: slot.id,
            parentId: parent.id,
            studentId: student.id,
            status: 'BOOKED',
            actionItems: JSON.stringify([]),
          },
        });
        count++;
      }
    }
    summaryMap['ptmBookings'] = count;
    console.log(`  PTM bookings: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] PTM bookings failed:', e.message);
  }

  // 4d. Conversations with messages (5 conversations × 3 messages)
  try {
    let convCount = 0;
    let msgCount = 0;
    const parentUsersAll = await prisma.user.findMany({ where: { schoolId: school.id, role: 'PARENT' }, take: 5 });
    const convParents = parentUsersAll.length > 0 ? parentUsersAll : [adminUser];

    const convTopics = [
      { subject: 'Regarding homework submission', messages: ['My child could not submit the homework on time due to illness.', 'I understand. Please submit by end of this week.', 'Thank you for your understanding.'] },
      { subject: 'Fee payment query', messages: ['I have a question about the fee structure for this term.', 'Please check the fee portal or visit the accounts office.', 'Thank you, will do.'] },
      { subject: 'Performance discussion', messages: ['Can we schedule a meeting to discuss my child\'s progress?', 'Sure, please come on Monday between 10-11am.', 'I will be there. Thank you.'] },
      { subject: 'Transport query', messages: ['The school bus was late today. Please advise.', 'We apologize for the delay. There was a traffic issue.', 'Understood. Please ensure timely pickup.'] },
      { subject: 'Sports day inquiry', messages: ['What are the items for sports day next week?', '100m race, long jump, and relay are planned for Class 9 & 10.', 'Great, my child is excited!'] },
    ];

    for (let ci = 0; ci < convTopics.length; ci++) {
      const parent = convParents[ci % convParents.length];
      const topic = convTopics[ci];

      const conv = await prisma.conversation.create({
        data: {
          participantIds: JSON.stringify([parent.id, teacher1.id]),
          type: 'PARENT_TEACHER',
          schoolId: school.id,
          lastMessageAt: new Date(),
        },
      });
      convCount++;

      const senders = [parent.id, teacher1.id, parent.id];
      for (let mi = 0; mi < topic.messages.length; mi++) {
        await prisma.message.create({
          data: {
            conversationId: conv.id,
            senderId: senders[mi],
            content: topic.messages[mi],
            createdAt: new Date(Date.now() - (topic.messages.length - mi) * 60 * 60 * 1000),
          },
        });
        msgCount++;
      }
    }
    summaryMap['conversations'] = convCount;
    summaryMap['messages'] = msgCount;
    console.log(`  Conversations: +${convCount}, Messages: +${msgCount}`);
  } catch (e: any) {
    console.error('  [WARN] Conversations failed:', e.message);
  }

  // 4e. Notifications (30 spread across users/types)
  try {
    let count = 0;
    const notifUsers = await prisma.user.findMany({ where: { schoolId: school.id }, take: 20 });
    const types = ['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'GENERAL', 'BUS'];
    const channels = ['PUSH', 'SMS', 'EMAIL'];
    const statuses = ['SENT', 'READ', 'PENDING'];

    const notifData = [
      { title: 'Attendance Marked', message: 'Your child was marked PRESENT for today.', type: 'ATTENDANCE' },
      { title: 'Fee Due Reminder', message: 'Tuition fee for April is due. Please pay by 10th April.', type: 'FEE_DUE' },
      { title: 'Test Result Available', message: 'Mathematics Unit Test result has been published.', type: 'TEST_RESULT' },
      { title: 'New Homework Assigned', message: 'Science assignment due in 3 days. Please check the portal.', type: 'HOMEWORK' },
      { title: 'Bus Delay Alert', message: 'School bus on Route A is running 15 minutes late today.', type: 'BUS' },
      { title: 'PTM Reminder', message: 'Parent-Teacher Meeting scheduled for next Monday. Confirm booking.', type: 'GENERAL' },
      { title: 'Attendance Alert', message: 'Your child\'s attendance has dropped below 75%. Immediate attention required.', type: 'ATTENDANCE' },
      { title: 'School Circular', message: 'Annual Sports Day will be held on 5th April. Participation mandatory.', type: 'GENERAL' },
      { title: 'Late Arrival Notice', message: 'Your child arrived late today at 09:15 AM.', type: 'ATTENDANCE' },
      { title: 'Result Published', message: 'Term 1 report cards are now available in the parent portal.', type: 'TEST_RESULT' },
    ];

    for (let i = 0; i < 30; i++) {
      const user = notifUsers[i % notifUsers.length];
      const notif = notifData[i % notifData.length];
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          channel: channels[i % channels.length],
          status: statuses[i % statuses.length],
          sentAt: statuses[i % statuses.length] !== 'PENDING' ? new Date(Date.now() - i * 30 * 60 * 1000) : null,
          readAt: statuses[i % statuses.length] === 'READ' ? new Date(Date.now() - i * 15 * 60 * 1000) : null,
        },
      });
      count++;
    }
    summaryMap['notifications'] = count;
    console.log(`  Notifications: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Notifications failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 5 — Staff Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 5: Staff Data ===');

  // 5a. Teacher attendance for all teachers today
  try {
    let count = 0;
    const todayDate = today();
    const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'LATE', 'PRESENT', 'PRESENT', 'ABSENT', 'PRESENT'];

    for (let i = 0; i < teachers.length; i++) {
      const t = teachers[i];
      const status = statuses[i % statuses.length];
      try {
        await prisma.teacherAttendance.upsert({
          where: { teacherId_date: { teacherId: t.id, date: todayDate } },
          update: {},
          create: {
            teacherId: t.id,
            date: todayDate,
            status,
            checkIn: status === 'PRESENT' ? '08:25' : status === 'LATE' ? '09:10' : undefined,
            checkOut: status !== 'ABSENT' ? '16:30' : undefined,
            remarks: status === 'LATE' ? 'Traffic delay' : status === 'ABSENT' ? 'On approved leave' : undefined,
          },
        });
        count++;
      } catch {}
    }
    summaryMap['teacherAttendance'] = count;
    console.log(`  Teacher attendance: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Teacher attendance failed:', e.message);
  }

  // 5b. Substitute assignments (3 for today)
  try {
    let count = 0;
    const todayDate = today();
    for (let i = 0; i < 3 && i < teachers.length - 1; i++) {
      const original = teachers[i];
      const substitute = teachers[(i + 1) % teachers.length];
      const exists = await prisma.substituteAssignment.findFirst({
        where: { originalTeacherId: original.id, substituteTeacherId: substitute.id, date: todayDate },
      });
      if (!exists) {
        await prisma.substituteAssignment.create({
          data: {
            originalTeacherId: original.id,
            substituteTeacherId: substitute.id,
            date: todayDate,
            classId: class10.id,
            sectionId: section10A.id,
            subjectId: subjects10[i % subjects10.length]?.id,
            reason: 'Original teacher on leave',
            status: 'ASSIGNED',
            assignedBy: adminUser.id,
          },
        });
        count++;
      }
    }
    summaryMap['substitutes'] = count;
    console.log(`  Substitute assignments: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Substitute assignments failed:', e.message);
  }

  // 5c. Exam schedule entries (5)
  try {
    let count = 0;
    // Create one exam schedule first
    let examSchedule = await prisma.examSchedule.findFirst({ where: { classId: class10.id, academicSessionId: session.id, type: 'FINAL_EXAM' } });
    if (!examSchedule) {
      examSchedule = await prisma.examSchedule.create({
        data: {
          name: 'Class 10 Final Examination 2026',
          type: 'FINAL_EXAM',
          classId: class10.id,
          academicSessionId: session.id,
          startDate: daysFromNow(30),
          endDate: daysFromNow(40),
          status: 'UPCOMING',
        },
      });
    }

    // Create schedule for Class 9 as well
    let examSchedule9 = await prisma.examSchedule.findFirst({ where: { classId: class9.id, academicSessionId: session.id, type: 'FINAL_EXAM' } });
    if (!examSchedule9) {
      examSchedule9 = await prisma.examSchedule.create({
        data: {
          name: 'Class 9 Final Examination 2026',
          type: 'FINAL_EXAM',
          classId: class9.id,
          academicSessionId: session.id,
          startDate: daysFromNow(30),
          endDate: daysFromNow(40),
          status: 'UPCOMING',
        },
      });
    }

    const examSubjects = [...subjects10.slice(0, 3), ...subjects9.slice(0, 2)];
    const schedules = [examSchedule, examSchedule, examSchedule, examSchedule9, examSchedule9];

    for (let i = 0; i < 5 && i < examSubjects.length; i++) {
      await prisma.examScheduleEntry.create({
        data: {
          scheduleId: schedules[i].id,
          subjectId: examSubjects[i].id,
          date: daysFromNow(30 + i * 2),
          startTime: '09:00',
          endTime: '12:00',
          room: `Hall ${i + 1}`,
          invigilatorId: teachers[i % teachers.length].id,
        },
      });
      count++;
    }
    summaryMap['examEntries'] = count;
    console.log(`  Exam schedule entries: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Exam schedule failed:', e.message);
  }

  // 5d. Leave applications (3 teacher leaves)
  try {
    let count = 0;
    const teacherLeavesData = [
      { applicantId: teachers[0].id, type: 'CASUAL', startDate: daysFromNow(5), endDate: daysFromNow(5), reason: 'Personal family function.', status: 'PENDING' },
      { applicantId: teachers[1 % teachers.length].id, type: 'SICK', startDate: daysFromNow(-3), endDate: daysFromNow(-2), reason: 'Medical appointment and recovery.', status: 'APPROVED', approvedBy: adminUser.id, approvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000) },
      { applicantId: teachers[2 % teachers.length].id, type: 'EARNED', startDate: daysFromNow(15), endDate: daysFromNow(18), reason: 'Planned vacation.', status: 'PENDING' },
    ];

    for (const lData of teacherLeavesData) {
      const exists = await prisma.leaveApplication.findFirst({
        where: { applicantId: lData.applicantId, startDate: lData.startDate },
      });
      if (!exists) {
        await prisma.leaveApplication.create({ data: lData as any });
        count++;
      }
    }
    summaryMap['leaveApps'] = count;
    console.log(`  Leave applications: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Leave applications failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 6 — Portal Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 6: Portal Data ===');

  // 6a. Student documents (10 for various students)
  try {
    let count = 0;
    const docTypes = ['BIRTH_CERTIFICATE', 'AADHAAR', 'PHOTO', 'TRANSFER_CERTIFICATE', 'MEDICAL', 'REPORT_CARD', 'ADDRESS_PROOF', 'CONSENT_FORM'];
    const docStudents = allStudents9And10.slice(1, 6); // skip first student who was already seeded

    for (let i = 0; i < docStudents.length && count < 10; i++) {
      const student = docStudents[i];
      // Add 2 docs per student
      for (let d = 0; d < 2 && count < 10; d++) {
        const docType = docTypes[(i * 2 + d) % docTypes.length];
        const exists = await prisma.studentDocument.findFirst({ where: { studentId: student.id, type: docType } });
        if (!exists) {
          await prisma.studentDocument.create({
            data: {
              studentId: student.id,
              type: docType,
              fileName: `${docType.toLowerCase()}_${student.id.slice(0, 6)}.pdf`,
              fileUrl: `https://storage.example.com/docs/${docType.toLowerCase()}_${student.id.slice(0, 6)}.pdf`,
              uploadedBy: adminUser.id,
              verified: d === 0,
              verifiedBy: d === 0 ? adminUser.id : null,
              verifiedAt: d === 0 ? new Date() : null,
            },
          });
          count++;
        }
      }
    }
    summaryMap['studentDocs'] = count;
    console.log(`  Student documents: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Student documents failed:', e.message);
  }

  // 6b. Student leave applications (5)
  try {
    let count = 0;
    const parentUsersForLeave = await prisma.user.findMany({ where: { schoolId: school.id, role: 'PARENT' }, take: 3 });
    const parentForLeave = parentUsersForLeave[0] || adminUser;
    const leaveStudents = allStudents9And10.slice(5, 10);

    const leaveData = [
      { type: 'SICK', startDate: daysFromNow(2), endDate: daysFromNow(3), reason: 'Fever and flu.', status: 'PENDING' },
      { type: 'FAMILY', startDate: daysFromNow(5), endDate: daysFromNow(6), reason: 'Family event.', status: 'APPROVED', approvedBy: teacher1.id, approvedAt: new Date() },
      { type: 'VACATION', startDate: daysFromNow(10), endDate: daysFromNow(12), reason: 'Family trip.', status: 'PENDING' },
      { type: 'SICK', startDate: daysFromNow(-5), endDate: daysFromNow(-4), reason: 'Dental extraction.', status: 'APPROVED', approvedBy: teacher2.id, approvedAt: new Date() },
      { type: 'OTHER', startDate: daysFromNow(7), endDate: daysFromNow(7), reason: 'State level competition.', status: 'PENDING' },
    ];

    for (let i = 0; i < 5 && i < leaveStudents.length; i++) {
      const student = leaveStudents[i];
      const ld = leaveData[i];
      const exists = await prisma.studentLeave.findFirst({ where: { studentId: student.id, startDate: ld.startDate } });
      if (!exists) {
        await prisma.studentLeave.create({
          data: { ...ld, studentId: student.id, appliedBy: parentForLeave.id } as any,
        });
        count++;
      }
    }
    summaryMap['studentLeaves'] = count;
    console.log(`  Student leave applications: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Student leaves failed:', e.message);
  }

  // 6c. Parent users linked to guardians (3)
  try {
    let count = 0;
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash('Parent@123', 10);

    const studentsForParent = students10A.slice(0, 3);
    for (let i = 0; i < studentsForParent.length; i++) {
      const student = studentsForParent[i];
      const guardians = await prisma.guardian.findMany({ where: { studentId: student.id } });
      if (guardians.length === 0) continue;

      const guardian = guardians[0];
      if (guardian.userId) continue; // already linked

      const email = `parent.${student.admissionNo.toLowerCase().replace(/[^a-z0-9]/g, '')}@school.edu`;
      let parentUser = await prisma.user.findFirst({ where: { email } });
      if (!parentUser) {
        parentUser = await prisma.user.create({
          data: {
            email,
            passwordHash,
            firstName: guardian.name.split(' ')[0],
            lastName: guardian.name.split(' ').slice(1).join(' ') || 'Parent',
            phone: guardian.phone,
            role: 'PARENT',
            schoolId: school.id,
          },
        });
      }

      await prisma.guardian.update({
        where: { id: guardian.id },
        data: { userId: parentUser.id },
      });
      count++;
    }
    summaryMap['parentUsers'] = count;
    console.log(`  Parent users linked: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Parent users failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 7 — Admin Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 7: Admin Data ===');

  // 7a. Audit logs (10 entries)
  try {
    let count = 0;
    const auditActions = ['LOGIN', 'CREATE', 'UPDATE', 'VIEW', 'APPROVE', 'REJECT'];
    const auditEntities = ['Student', 'Attendance', 'Payment', 'Incident', 'LeaveApplication', 'ReportCard'];
    const auditUsers = await prisma.user.findMany({ where: { schoolId: school.id }, take: 5 });

    for (let i = 0; i < 10; i++) {
      const user = auditUsers[i % auditUsers.length];
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: auditActions[i % auditActions.length],
          entity: auditEntities[i % auditEntities.length],
          entityId: allStudents9And10[i % allStudents9And10.length]?.id || null,
          details: JSON.stringify({ note: `${auditActions[i % auditActions.length]} operation performed`, timestamp: new Date().toISOString() }),
          ipAddress: `192.168.1.${10 + i}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
          createdAt: new Date(Date.now() - i * 60 * 60 * 1000),
        },
      });
      count++;
    }
    summaryMap['auditLogs'] = count;
    console.log(`  Audit logs: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Audit logs failed:', e.message);
  }

  // 7b. System settings (5)
  try {
    let count = 0;
    const settingsData = [
      { key: 'school.working_days', value: 'MON,TUE,WED,THU,FRI', category: 'ACADEMIC', label: 'Working Days', type: 'STRING' },
      { key: 'attendance.min_percentage', value: '75', category: 'ATTENDANCE', label: 'Minimum Attendance Percentage', type: 'NUMBER' },
      { key: 'grading.pass_percentage', value: '40', category: 'GRADING', label: 'Minimum Passing Percentage', type: 'NUMBER' },
      { key: 'fee.late_fine_per_day', value: '10', category: 'FEE', label: 'Late Fee Fine Per Day (₹)', type: 'NUMBER' },
      { key: 'notification.sms_enabled', value: 'true', category: 'NOTIFICATION', label: 'SMS Notifications Enabled', type: 'BOOLEAN' },
    ];

    for (const sd of settingsData) {
      const exists = await prisma.systemSetting.findFirst({ where: { key: sd.key } });
      if (!exists) {
        await prisma.systemSetting.create({
          data: { ...sd, schoolId: school.id, updatedBy: adminUser.id },
        });
        count++;
      }
    }
    summaryMap['systemSettings'] = count;
    console.log(`  System settings: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] System settings failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 8 — Workflow Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 8: Workflow Data ===');

  // 8a. Calendar events (5)
  try {
    let count = 0;
    const eventsData = [
      { title: 'Holi — School Holiday', type: 'HOLIDAY', startDate: daysFromNow(10), endDate: daysFromNow(10), description: 'School closed for Holi festival.', isPublic: true },
      { title: 'Good Friday — School Holiday', type: 'HOLIDAY', startDate: daysFromNow(25), endDate: daysFromNow(25), description: 'School closed on account of Good Friday.', isPublic: true },
      { title: 'Annual Final Examinations Begin', type: 'EXAM', startDate: daysFromNow(30), endDate: daysFromNow(40), description: 'Annual final examinations for all classes.', isPublic: true },
      { title: 'Annual Sports Day', type: 'EVENT', startDate: daysFromNow(5), endDate: daysFromNow(5), description: 'Annual sports day celebration. All students must participate.', isPublic: true },
      { title: 'Staff Meeting — Academic Planning', type: 'MEETING', startDate: daysFromNow(3), endDate: daysFromNow(3), description: 'Staff meeting to plan next academic year structure.', isPublic: false },
    ];

    for (const ed of eventsData) {
      const exists = await prisma.calendarEvent.findFirst({ where: { title: ed.title, schoolId: school.id } });
      if (!exists) {
        await prisma.calendarEvent.create({
          data: { ...ed, schoolId: school.id, createdBy: adminUser.id },
        });
        count++;
      }
    }
    summaryMap['calendarEvents'] = count;
    console.log(`  Calendar events: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Calendar events failed:', e.message);
  }

  // 8b. Announcements (3)
  try {
    let count = 0;
    const announcementsData = [
      { title: 'URGENT: School Bus Route Change Effective Tomorrow', content: 'Due to road construction on NH-8, the morning pick-up route for Bus A will be changed. New route: Gate → Sector 5 → Sector 12 → School. Pickup time adjusted to 7:30 AM. Parents are requested to note the change.', type: 'URGENT', audience: 'PARENTS', priority: 'URGENT', isPublished: true, publishedAt: new Date() },
      { title: 'Annual Examination Schedule Circular — 2026', content: 'Annual examinations for classes 9-12 will commence from April 1st, 2026. The detailed subject-wise timetable is attached. Students are advised to complete their syllabus by March 25th. No leaves will be granted during examination period.', type: 'CIRCULAR', audience: 'ALL', priority: 'HIGH', isPublished: true, publishedAt: new Date() },
      { title: 'PTM Notice — Class 10 Parents', content: 'Parent-Teacher Meeting for Class 10 is scheduled on March 28th, 2026 from 9:00 AM to 1:00 PM. Attendance is mandatory. Please book your time slot through the parent portal or contact the class teacher.', type: 'NOTICE', audience: 'PARENTS', priority: 'NORMAL', isPublished: false },
    ];

    for (const ad of announcementsData) {
      const exists = await prisma.announcement.findFirst({ where: { title: ad.title, schoolId: school.id } });
      if (!exists) {
        await prisma.announcement.create({
          data: { ...ad, schoolId: school.id, createdBy: adminUser.id, expiresAt: daysFromNow(30) },
        });
        count++;
      }
    }
    summaryMap['announcements'] = count;
    console.log(`  Announcements: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Announcements failed:', e.message);
  }

  // 8c. Concession requests (3)
  try {
    let count = 0;
    if (feeHeads.length > 0) {
      const concStudents = allStudents9And10.slice(30, 35);
      const concessionTypes = ['SCHOLARSHIP', 'SIBLING', 'MERIT'];
      const concessionStatuses = ['APPROVED', 'PENDING', 'REJECTED'];

      for (let i = 0; i < 3 && i < concStudents.length; i++) {
        const student = concStudents[i];
        const feeHead = feeHeads[i % feeHeads.length];
        const exists = await prisma.concession.findFirst({ where: { studentId: student.id, feeHeadId: feeHead.id } });
        if (!exists) {
          await prisma.concession.create({
            data: {
              studentId: student.id,
              feeHeadId: feeHead.id,
              type: concessionTypes[i],
              discountPercent: i === 0 ? 50 : i === 1 ? 25 : null,
              discountAmount: i === 2 ? 1000 : null,
              approvedBy: concessionStatuses[i] !== 'PENDING' ? adminUser.id : null,
              reason: i === 0 ? 'State merit scholarship holder.' : i === 1 ? 'Sibling studying in same school.' : 'Management discretion concession.',
              status: concessionStatuses[i],
            },
          });
          count++;
        }
      }
    }
    summaryMap['concessions'] = count;
    console.log(`  Concession requests: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Concessions failed:', e.message);
  }

  // 8d. Result publications (2)
  try {
    let count = 0;
    const rpData = [
      { classId: class10.id, subjectId: math10.id, term: 'TERM_1', status: 'SUBMITTED', submittedBy: teacher1.id, submittedAt: new Date() },
      { classId: class9.id, subjectId: math9.id, term: 'TERM_1', status: 'APPROVED', submittedBy: teacher2.id, submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), approvedBy: adminUser.id, approvedAt: new Date() },
    ];

    for (const rp of rpData) {
      const exists = await prisma.resultPublication.findFirst({
        where: { classId: rp.classId, subjectId: rp.subjectId, academicSessionId: session.id, term: rp.term },
      });
      if (!exists) {
        await prisma.resultPublication.create({
          data: { ...rp, academicSessionId: session.id } as any,
        });
        count++;
      }
    }
    summaryMap['resultPubs'] = count;
    console.log(`  Result publications: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Result publications failed:', e.message);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 9 — Advanced Data
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n=== PHASE 9: Advanced Data ===');

  // 9a. Period attendance (5 records for Class 10A today)
  try {
    let count = 0;
    const todayDate = today();
    const periodStudents = students10A.slice(0, 5);

    for (let i = 0; i < periodStudents.length; i++) {
      const student = periodStudents[i];
      const period = i + 1;
      const subj = subjects10[i % subjects10.length];
      try {
        await prisma.periodAttendance.upsert({
          where: { studentId_date_period: { studentId: student.id, date: todayDate, period } },
          update: {},
          create: {
            studentId: student.id,
            date: todayDate,
            period,
            subjectId: subj?.id || null,
            teacherId: teachers[i % teachers.length].id,
            status: Math.random() > 0.15 ? 'PRESENT' : 'ABSENT',
          },
        });
        count++;
      } catch {}
    }
    summaryMap['periodAttendance'] = count;
    console.log(`  Period attendance: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Period attendance failed:', e.message);
  }

  // 9b. Remedial enrollments (3)
  try {
    let count = 0;
    if (assessments10.length > 0) {
      const remedialStudents = students10A.slice(0, 3);
      for (let i = 0; i < remedialStudents.length; i++) {
        const student = remedialStudents[i];
        const assessment = assessments10[i % assessments10.length];
        const exists = await prisma.remedialEnrollment.findFirst({ where: { studentId: student.id, assessmentId: assessment.id } });
        if (!exists) {
          await prisma.remedialEnrollment.create({
            data: {
              studentId: student.id,
              subjectId: assessment.subjectId,
              assessmentId: assessment.id,
              originalScore: Math.floor(Math.random() * 10) + 20, // low score
              maxMarks: assessment.totalMarks,
              status: i === 0 ? 'IN_PROGRESS' : 'ENROLLED',
              teacherId: teacher1.id,
              remarks: 'Enrolled for remedial classes to improve performance.',
            },
          });
          count++;
        }
      }
    }
    summaryMap['remedialEnrollments'] = count;
    console.log(`  Remedial enrollments: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Remedial enrollments failed:', e.message);
  }

  // 9c. Grace marks (2)
  try {
    let count = 0;
    const graceStudents = students10A.slice(3, 5);
    for (let i = 0; i < graceStudents.length && i < 2; i++) {
      const student = graceStudents[i];
      const subj = subjects10[i % subjects10.length];
      const assessment = assessments10[i % assessments10.length] || null;
      try {
        await prisma.graceMark.create({
          data: {
            studentId: student.id,
            subjectId: subj.id,
            assessmentId: assessment?.id || null,
            marks: 3 + i,
            reason: i === 0 ? 'MEDICAL' : 'SPORTS',
            approvedBy: adminUser.id,
            term: 'TERM_1',
          },
        });
        count++;
      } catch {}
    }
    summaryMap['graceMarks'] = count;
    console.log(`  Grace marks: +${count}`);
  } catch (e: any) {
    console.error('  [WARN] Grace marks failed:', e.message);
  }

  // ─── Final Summary ────────────────────────────────────────────────────────

  console.log('\n════════════════════════════════════════════════════');
  console.log('  COMPREHENSIVE SEED COMPLETE — SUMMARY');
  console.log('════════════════════════════════════════════════════');
  for (const [key, val] of Object.entries(summaryMap)) {
    console.log(`  ${key.padEnd(28)}: +${val}`);
  }
  console.log('════════════════════════════════════════════════════');
  const total = Object.values(summaryMap).reduce((a, b) => a + b, 0);
  console.log(`  TOTAL RECORDS ADDED       : ${total}`);
  console.log('════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('FATAL ERROR:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
