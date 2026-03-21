import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding additional data...');

  // Get existing school and session
  const school = await prisma.school.findFirst();
  if (!school) throw new Error('Run base seed first');
  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) throw new Error('No active session');

  const passwordHash = await bcrypt.hash('password123', 10);

  // ─── Staff Users ──────────────────────────────────────
  const staffData = [
    { email: 'director@medicaps.edu.in', firstName: 'Rajesh', lastName: 'Sharma', role: 'DIRECTOR' },
    { email: 'coordinator@medicaps.edu.in', firstName: 'Priya', lastName: 'Verma', role: 'ACADEMIC_COORDINATOR' },
    { email: 'accountant@medicaps.edu.in', firstName: 'Sunil', lastName: 'Gupta', role: 'ACCOUNTANT' },
    { email: 'transport@medicaps.edu.in', firstName: 'Ramesh', lastName: 'Yadav', role: 'TRANSPORT_MANAGER' },
    { email: 'hobby@medicaps.edu.in', firstName: 'Anita', lastName: 'Joshi', role: 'HOBBY_COORDINATOR' },
    { email: 'itadmin@medicaps.edu.in', firstName: 'Vikram', lastName: 'Singh', role: 'IT_ADMIN' },
  ];

  for (const s of staffData) {
    await prisma.user.create({
      data: { ...s, passwordHash, schoolId: school.id },
    });
  }
  console.log(`Created ${staffData.length} staff users`);

  // ─── Teachers ─────────────────────────────────────────
  const teacherNames = [
    { firstName: 'Meena', lastName: 'Iyer', email: 'meena.iyer@medicaps.edu.in' },
    { firstName: 'Arun', lastName: 'Patel', email: 'arun.patel@medicaps.edu.in' },
    { firstName: 'Kavita', lastName: 'Dubey', email: 'kavita.dubey@medicaps.edu.in' },
    { firstName: 'Sanjay', lastName: 'Mishra', email: 'sanjay.mishra@medicaps.edu.in' },
    { firstName: 'Neha', lastName: 'Agarwal', email: 'neha.agarwal@medicaps.edu.in' },
    { firstName: 'Deepak', lastName: 'Tiwari', email: 'deepak.tiwari@medicaps.edu.in' },
    { firstName: 'Sunita', lastName: 'Reddy', email: 'sunita.reddy@medicaps.edu.in' },
    { firstName: 'Manoj', lastName: 'Chouhan', email: 'manoj.chouhan@medicaps.edu.in' },
    { firstName: 'Ritu', lastName: 'Saxena', email: 'ritu.saxena@medicaps.edu.in' },
    { firstName: 'Ashok', lastName: 'Jain', email: 'ashok.jain@medicaps.edu.in' },
  ];

  const teachers = [];
  for (const [i, t] of teacherNames.entries()) {
    const role = i < 5 ? 'CLASS_TEACHER' : 'SUBJECT_TEACHER';
    const teacher = await prisma.user.create({
      data: { ...t, passwordHash, role, schoolId: school.id },
    });
    teachers.push(teacher);
  }
  console.log(`Created ${teachers.length} teachers`);

  // ─── Subjects for classes 1-12 ────────────────────────
  const classes = await prisma.class.findMany({
    where: { schoolId: school.id },
    include: { sections: true },
    orderBy: { grade: 'asc' },
  });

  const subjectsByGrade: Record<string, string[]> = {
    primary: ['English', 'Hindi', 'Mathematics', 'EVS', 'Computer Science'],
    middle: ['English', 'Hindi', 'Mathematics', 'Science', 'Social Studies', 'Computer Science', 'Sanskrit'],
    senior: ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'Hindi', 'Physical Education'],
  };

  const allSubjects: any[] = [];
  // Get existing subjects to avoid duplicates
  const existingSubjects = await prisma.subject.findMany();
  const existingSubjectKeys = new Set(existingSubjects.map(s => `${s.code}-${s.classId}`));

  for (const cls of classes) {
    let subjectList: string[];
    if (cls.grade <= 5) subjectList = subjectsByGrade.primary;
    else if (cls.grade <= 8) subjectList = subjectsByGrade.middle;
    else subjectList = subjectsByGrade.senior;

    for (const name of subjectList) {
      const code = `C${cls.grade}-${name.substring(0, 3).toUpperCase()}`;
      if (existingSubjectKeys.has(`${code}-${cls.id}`)) continue;

      try {
        const subject = await prisma.subject.create({
          data: { name, code, classId: cls.id },
        });
        allSubjects.push(subject);
      } catch {
        // skip duplicates
      }
    }
  }
  console.log(`Created ${allSubjects.length} subjects`);

  // ─── Students (20 per section for classes 9-10) ───────
  const studentFirstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
    'Ananya', 'Diya', 'Myra', 'Sara', 'Aanya', 'Aadhya', 'Ira', 'Saanvi', 'Pihu', 'Kavya',
    'Rohan', 'Karan', 'Rahul', 'Amit', 'Nikhil', 'Priya', 'Shreya', 'Pooja', 'Riya', 'Sneha',
    'Tanvi', 'Nisha', 'Mohit', 'Harsh', 'Gaurav', 'Divya', 'Mansi', 'Pallavi', 'Swati', 'Komal',
  ];

  const studentLastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Gupta', 'Mishra', 'Yadav', 'Joshi', 'Dubey',
    'Agarwal', 'Chouhan', 'Tiwari', 'Reddy', 'Saxena', 'Jain', 'Mehta', 'Pandey', 'Thakur', 'Soni',
  ];

  let studentCount = 0;
  const targetClasses = classes.filter(c => c.grade >= 9 && c.grade <= 10);

  for (const cls of targetClasses) {
    const sections = await prisma.section.findMany({ where: { classId: cls.id } });

    for (const section of sections) {
      for (let i = 0; i < 20; i++) {
        const fnIdx = (studentCount + i) % studentFirstNames.length;
        const lnIdx = (studentCount + i + 3) % studentLastNames.length;
        const firstName = studentFirstNames[fnIdx];
        const lastName = studentLastNames[lnIdx];
        const admissionNo = `MIS-${cls.grade}${section.name}-${String(i + 1).padStart(3, '0')}`;
        const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.${cls.grade}${section.name.toLowerCase()}@student.medicaps.edu.in`;

        const gender = fnIdx < 10 ? 'MALE' : fnIdx < 20 ? 'FEMALE' : fnIdx % 2 === 0 ? 'MALE' : 'FEMALE';
        const dob = new Date(2012 - cls.grade + 10, (i * 3) % 12, (i * 7 % 28) + 1);

        const user = await prisma.user.create({
          data: {
            email,
            passwordHash: passwordHash,
            firstName,
            lastName,
            role: 'STUDENT',
            schoolId: school.id,
          },
        });

        const student = await prisma.student.create({
          data: {
            admissionNo,
            userId: user.id,
            classId: cls.id,
            sectionId: section.id,
            rollNo: i + 1,
            dateOfBirth: dob,
            gender,
            bloodGroup: ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-'][i % 6],
            addressLine1: `${100 + i} Vijay Nagar`,
            city: 'Indore',
            state: 'Madhya Pradesh',
            pincode: '452010',
            academicSessionId: session.id,
          },
        });

        // Add guardian
        await prisma.guardian.create({
          data: {
            studentId: student.id,
            relation: 'FATHER',
            name: `Mr. ${studentLastNames[(lnIdx + 1) % studentLastNames.length]}`,
            phone: `98765${String(10000 + studentCount + i).slice(-5)}`,
            email: `parent.${lastName.toLowerCase()}${studentCount + i}@gmail.com`,
            occupation: ['Engineer', 'Doctor', 'Business', 'Teacher', 'Lawyer'][i % 5],
          },
        });

        await prisma.guardian.create({
          data: {
            studentId: student.id,
            relation: 'MOTHER',
            name: `Mrs. ${studentLastNames[(lnIdx + 1) % studentLastNames.length]}`,
            phone: `98764${String(10000 + studentCount + i).slice(-5)}`,
          },
        });

        studentCount++;
      }
    }
  }
  console.log(`Created ${studentCount} students with guardians`);

  // ─── Admission Enquiries ──────────────────────────────
  const enquiries = [
    { studentName: 'Aryan Kapoor', parentName: 'Vikash Kapoor', parentPhone: '9876501001', classAppliedFor: 'Class 6', source: 'WALK_IN', status: 'ENQUIRY' },
    { studentName: 'Riya Malhotra', parentName: 'Suresh Malhotra', parentPhone: '9876501002', classAppliedFor: 'Class 3', source: 'WEBSITE', status: 'APPLICATION' },
    { studentName: 'Dev Choudhary', parentName: 'Rajeev Choudhary', parentPhone: '9876501003', classAppliedFor: 'Class 9', source: 'REFERRAL', status: 'ENTRANCE_TEST' },
    { studentName: 'Sanya Bhatt', parentName: 'Anil Bhatt', parentPhone: '9876501004', classAppliedFor: 'Class 1', source: 'ADVERTISEMENT', status: 'INTERVIEW' },
    { studentName: 'Kabir Mehra', parentName: 'Ajay Mehra', parentPhone: '9876501005', classAppliedFor: 'Class 5', source: 'WALK_IN', status: 'OFFER' },
    { studentName: 'Zara Sheikh', parentName: 'Imran Sheikh', parentPhone: '9876501006', classAppliedFor: 'Class 7', source: 'WEBSITE', status: 'ACCEPTED' },
    { studentName: 'Advait Nair', parentName: 'Krishnan Nair', parentPhone: '9876501007', classAppliedFor: 'Class 11', source: 'REFERRAL', status: 'ENROLLED' },
    { studentName: 'Mira Desai', parentName: 'Prakash Desai', parentPhone: '9876501008', classAppliedFor: 'Class 4', source: 'WALK_IN', status: 'ENQUIRY' },
    { studentName: 'Ishaan Rao', parentName: 'Sudhir Rao', parentPhone: '9876501009', classAppliedFor: 'Class 8', source: 'ADVERTISEMENT', status: 'REJECTED' },
    { studentName: 'Tara Bose', parentName: 'Subhash Bose', parentPhone: '9876501010', classAppliedFor: 'Class 2', source: 'WEBSITE', status: 'WITHDRAWN' },
    { studentName: 'Arnav Pillai', parentName: 'Gopal Pillai', parentPhone: '9876501011', classAppliedFor: 'Class 6', source: 'REFERRAL', status: 'ENQUIRY' },
    { studentName: 'Kiara Khanna', parentName: 'Rahul Khanna', parentPhone: '9876501012', classAppliedFor: 'Class 10', source: 'WALK_IN', status: 'APPLICATION' },
  ];

  for (const e of enquiries) {
    await prisma.admissionEnquiry.create({
      data: { ...e, academicSessionId: session.id },
    });
  }
  console.log(`Created ${enquiries.length} admission enquiries`);

  // ─── Attendance (last 7 days for Class 10A) ───────────
  const class10 = classes.find(c => c.grade === 10)!;
  const section10A = await prisma.section.findFirst({ where: { classId: class10.id, name: 'A' } });
  const class10AStudents = await prisma.student.findMany({
    where: { classId: class10.id, sectionId: section10A!.id },
  });

  const classTeacher = await prisma.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  const statuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE', 'HALF_DAY'];
  let attendanceCount = 0;

  for (let dayOffset = 1; dayOffset <= 7; dayOffset++) {
    const date = new Date();
    date.setDate(date.getDate() - dayOffset);
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    for (const [i, student] of class10AStudents.entries()) {
      const status = statuses[(i + dayOffset) % statuses.length];
      await prisma.attendance.create({
        data: {
          studentId: student.id,
          date: new Date(date.toISOString().split('T')[0]),
          status,
          markedById: classTeacher!.id,
          remarks: status === 'ABSENT' ? 'No information' : status === 'LATE' ? 'Arrived 15 min late' : undefined,
        },
      });
      attendanceCount++;
    }
  }
  console.log(`Created ${attendanceCount} attendance records`);

  // ─── Syllabus for Class 10 Math ───────────────────────
  const mathSubject = await prisma.subject.findFirst({
    where: { classId: class10.id, name: 'Mathematics' },
  });

  if (mathSubject) {
    const syllabus = await prisma.syllabus.create({
      data: {
        subjectId: mathSubject.id,
        classId: class10.id,
        academicSessionId: session.id,
      },
    });

    const chapters = [
      {
        title: 'Real Numbers',
        estimatedHours: 15,
        topics: [
          { title: 'Euclid\'s Division Lemma', estimatedMinutes: 90, objectives: ['Understand Euclid\'s division algorithm', 'Apply to find HCF'] },
          { title: 'Fundamental Theorem of Arithmetic', estimatedMinutes: 90, objectives: ['Prove and apply the theorem'] },
          { title: 'Irrational Numbers', estimatedMinutes: 60, objectives: ['Prove irrationality of √2, √3'] },
          { title: 'Decimal Expansions', estimatedMinutes: 60, objectives: ['Relate rational numbers to decimals'] },
        ],
      },
      {
        title: 'Polynomials',
        estimatedHours: 12,
        topics: [
          { title: 'Zeros of a Polynomial', estimatedMinutes: 90, objectives: ['Find zeros graphically and algebraically'] },
          { title: 'Relationship between Zeros and Coefficients', estimatedMinutes: 90, objectives: ['Apply Vieta\'s formulas'] },
          { title: 'Division Algorithm for Polynomials', estimatedMinutes: 60, objectives: ['Perform polynomial long division'] },
        ],
      },
      {
        title: 'Pair of Linear Equations in Two Variables',
        estimatedHours: 15,
        topics: [
          { title: 'Graphical Method', estimatedMinutes: 90, objectives: ['Solve systems graphically'] },
          { title: 'Substitution Method', estimatedMinutes: 60, objectives: ['Solve by substitution'] },
          { title: 'Elimination Method', estimatedMinutes: 60, objectives: ['Solve by elimination'] },
          { title: 'Cross-Multiplication Method', estimatedMinutes: 60, objectives: ['Apply cross-multiplication'] },
          { title: 'Word Problems', estimatedMinutes: 90, objectives: ['Model and solve real-world problems'] },
        ],
      },
      {
        title: 'Quadratic Equations',
        estimatedHours: 12,
        topics: [
          { title: 'Standard Form and Solutions', estimatedMinutes: 90, objectives: ['Identify and solve quadratic equations'] },
          { title: 'Factorization Method', estimatedMinutes: 60, objectives: ['Solve by factoring'] },
          { title: 'Quadratic Formula', estimatedMinutes: 90, objectives: ['Derive and apply the formula'] },
          { title: 'Nature of Roots', estimatedMinutes: 60, objectives: ['Analyze discriminant'] },
        ],
      },
      {
        title: 'Trigonometry',
        estimatedHours: 18,
        topics: [
          { title: 'Trigonometric Ratios', estimatedMinutes: 90, objectives: ['Define and calculate sin, cos, tan'] },
          { title: 'Trigonometric Ratios of Specific Angles', estimatedMinutes: 60, objectives: ['Know values for 0°, 30°, 45°, 60°, 90°'] },
          { title: 'Complementary Angles', estimatedMinutes: 60, objectives: ['Apply complementary angle identities'] },
          { title: 'Trigonometric Identities', estimatedMinutes: 90, objectives: ['Prove and apply identities'] },
          { title: 'Heights and Distances', estimatedMinutes: 90, objectives: ['Solve application problems'] },
        ],
      },
    ];

    for (const [ci, ch] of chapters.entries()) {
      const chapter = await prisma.chapter.create({
        data: {
          syllabusId: syllabus.id,
          title: ch.title,
          orderIndex: ci + 1,
          estimatedHours: ch.estimatedHours,
        },
      });

      for (const [ti, topic] of ch.topics.entries()) {
        await prisma.topic.create({
          data: {
            chapterId: chapter.id,
            title: topic.title,
            orderIndex: ti + 1,
            estimatedMinutes: topic.estimatedMinutes,
            learningObjectives: topic.objectives,
          },
        });
      }
    }
    console.log(`Created syllabus with ${chapters.length} chapters for Class 10 Mathematics`);
  }

  // ─── Syllabus for Class 10 Science ────────────────────
  const scienceSubject = await prisma.subject.findFirst({
    where: { classId: class10.id, name: 'Science' },
  });

  if (scienceSubject) {
    const syllabus = await prisma.syllabus.create({
      data: {
        subjectId: scienceSubject.id,
        classId: class10.id,
        academicSessionId: session.id,
      },
    });

    const chapters = [
      { title: 'Chemical Reactions and Equations', estimatedHours: 10, topics: ['Types of Chemical Reactions', 'Balancing Equations', 'Corrosion and Rancidity'] },
      { title: 'Acids, Bases and Salts', estimatedHours: 12, topics: ['Properties of Acids and Bases', 'pH Scale', 'Salts and their Properties'] },
      { title: 'Metals and Non-metals', estimatedHours: 10, topics: ['Physical Properties', 'Chemical Properties', 'Occurrence and Extraction'] },
      { title: 'Life Processes', estimatedHours: 15, topics: ['Nutrition', 'Respiration', 'Transportation', 'Excretion'] },
      { title: 'Light - Reflection and Refraction', estimatedHours: 12, topics: ['Reflection by Mirrors', 'Refraction by Lenses', 'Power of a Lens'] },
    ];

    for (const [ci, ch] of chapters.entries()) {
      const chapter = await prisma.chapter.create({
        data: {
          syllabusId: syllabus.id,
          title: ch.title,
          orderIndex: ci + 1,
          estimatedHours: ch.estimatedHours,
        },
      });

      for (const [ti, topicTitle] of ch.topics.entries()) {
        await prisma.topic.create({
          data: {
            chapterId: chapter.id,
            title: topicTitle,
            orderIndex: ti + 1,
            estimatedMinutes: 60,
          },
        });
      }
    }
    console.log('Created syllabus for Class 10 Science');
  }

  // ─── Timetable for Class 10A ──────────────────────────
  if (section10A) {
    const subjects10 = await prisma.subject.findMany({ where: { classId: class10.id } });
    const subjectMap = new Map(subjects10.map(s => [s.name, s.id]));

    const timetable = await prisma.timetable.create({
      data: {
        classId: class10.id,
        sectionId: section10A.id,
        academicSessionId: session.id,
        effectiveFrom: new Date('2026-04-01'),
      },
    });

    // Mon-Fri schedule
    const dailySchedule = [
      { start: '08:00', end: '08:30', type: 'ASSEMBLY', subject: null },
      { start: '08:30', end: '09:15', type: 'LECTURE', subject: 'Mathematics' },
      { start: '09:15', end: '10:00', type: 'LECTURE', subject: 'Science' },
      { start: '10:00', end: '10:15', type: 'BREAK', subject: null },
      { start: '10:15', end: '11:00', type: 'LECTURE', subject: 'English' },
      { start: '11:00', end: '11:45', type: 'LECTURE', subject: 'Hindi' },
      { start: '11:45', end: '12:30', type: 'BREAK', subject: null },
      { start: '12:30', end: '13:15', type: 'LECTURE', subject: 'Computer Science' },
      { start: '13:15', end: '14:00', type: 'LECTURE', subject: 'Physical Education' },
    ];

    // Vary subjects per day
    const dayVariations: Record<number, string[]> = {
      1: ['Mathematics', 'Science', 'English', 'Hindi', 'Computer Science', 'Physical Education'],
      2: ['English', 'Mathematics', 'Hindi', 'Science', 'Physical Education', 'Computer Science'],
      3: ['Science', 'Hindi', 'Mathematics', 'English', 'Computer Science', 'Physical Education'],
      4: ['Hindi', 'English', 'Science', 'Mathematics', 'Physical Education', 'Computer Science'],
      5: ['Mathematics', 'Computer Science', 'English', 'Science', 'Hindi', 'Physical Education'],
    };

    for (let day = 1; day <= 5; day++) {
      const subjects = dayVariations[day];
      let subjectIdx = 0;

      for (const slot of dailySchedule) {
        const subjectName = slot.type === 'LECTURE' ? subjects[subjectIdx++] : null;
        const subjectId = subjectName ? subjectMap.get(subjectName) || null : null;

        await prisma.timetableSlot.create({
          data: {
            timetableId: timetable.id,
            dayOfWeek: day,
            startTime: slot.start,
            endTime: slot.end,
            type: slot.type,
            subjectId,
            room: slot.type === 'LECTURE' ? `Room ${100 + day}` : null,
          },
        });
      }
    }
    console.log('Created timetable for Class 10A (Mon-Fri)');
  }

  console.log('\n--- Seed Summary ---');
  console.log(`Total users: ${await prisma.user.count()}`);
  console.log(`Total students: ${await prisma.student.count()}`);
  console.log(`Total subjects: ${await prisma.subject.count()}`);
  console.log(`Total attendance records: ${await prisma.attendance.count()}`);
  console.log(`Total enquiries: ${await prisma.admissionEnquiry.count()}`);
  console.log(`Total syllabi: ${await prisma.syllabus.count()}`);
  console.log(`Total timetable slots: ${await prisma.timetableSlot.count()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
