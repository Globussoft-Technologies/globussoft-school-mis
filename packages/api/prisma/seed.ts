import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create school
  const school = await prisma.school.create({
    data: {
      name: 'Medicaps International School',
      code: 'MIS-IDR',
      address: 'Indore, Madhya Pradesh',
      phone: '0731-1234567',
      email: 'info@medicaps.edu.in',
    },
  });

  // Create academic session
  const session = await prisma.academicSession.create({
    data: {
      name: '2026-27',
      startDate: new Date('2026-04-01'),
      endDate: new Date('2027-03-31'),
      status: 'ACTIVE',
      schoolId: school.id,
    },
  });

  // Create super admin
  const passwordHash = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      email: 'admin@medicaps.edu.in',
      passwordHash,
      firstName: 'Super',
      lastName: 'Admin',
      role: 'SUPER_ADMIN',
      schoolId: school.id,
    },
  });

  // Create classes (1-12)
  const classes = [];
  for (let grade = 1; grade <= 12; grade++) {
    const cls = await prisma.class.create({
      data: {
        name: `Class ${grade}`,
        grade,
        schoolId: school.id,
      },
    });
    classes.push(cls);

    // Create sections A, B for each class
    for (const sectionName of ['A', 'B']) {
      await prisma.section.create({
        data: { name: sectionName, classId: cls.id, capacity: 40 },
      });
    }
  }

  // Create sample subjects for Class 10
  const class10 = classes[9];
  const subjects = ['Mathematics', 'Science', 'English', 'Hindi', 'Social Studies'];
  for (const [i, name] of subjects.entries()) {
    await prisma.subject.create({
      data: {
        name,
        code: `C10-${name.substring(0, 3).toUpperCase()}`,
        classId: class10.id,
      },
    });
  }

  // Create a sample teacher
  const teacherHash = await bcrypt.hash('teacher123', 10);
  await prisma.user.create({
    data: {
      email: 'teacher@medicaps.edu.in',
      passwordHash: teacherHash,
      firstName: 'Sample',
      lastName: 'Teacher',
      role: 'CLASS_TEACHER',
      schoolId: school.id,
    },
  });

  // Fetch the teacher user for diary entries
  const teacher = await prisma.user.findFirst({ where: { role: 'CLASS_TEACHER', schoolId: school.id } });
  const teacherId = teacher?.id ?? 'system';

  // Fetch admin for events
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';

  // Class 10 section A for diary entries
  const class10ForDiary = classes[9];
  const sectionA = await prisma.section.findFirst({ where: { classId: class10ForDiary.id, name: 'A' } });

  // ─── 5 Diary Entries ─────────────────────────────────────────────
  const today = new Date();
  const diaryData = [
    {
      classId: class10ForDiary.id,
      sectionId: sectionA?.id,
      date: new Date(today.toISOString().split('T')[0]),
      type: 'HOMEWORK',
      subject: 'Mathematics',
      content: 'Complete exercises 5.1 to 5.5 from Chapter 5 (Arithmetic Progressions). Show full working.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10ForDiary.id,
      sectionId: sectionA?.id,
      date: new Date(today.toISOString().split('T')[0]),
      type: 'CLASSWORK',
      subject: 'Science',
      content: 'Lab activity: Study of osmosis using potato strips in different salt concentrations. Write observations.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10ForDiary.id,
      date: new Date(today.toISOString().split('T')[0]),
      type: 'CIRCULAR',
      content: 'Annual Sports Day is scheduled on 25th March 2026. Students participating must register with the PE teacher by 22nd March.',
      createdBy: adminId,
      isPublished: true,
    },
    {
      classId: class10ForDiary.id,
      sectionId: sectionA?.id,
      date: new Date(today.toISOString().split('T')[0]),
      type: 'NOTE',
      subject: 'English',
      content: 'Chapter 7: "The Necklace" by Guy de Maupassant. Read and prepare summary for discussion tomorrow.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10ForDiary.id,
      date: new Date(today.toISOString().split('T')[0]),
      type: 'REMINDER',
      content: 'Unit Test for Term 2 begins on 28th March. Syllabus: Maths Ch 5-7, Science Ch 10-12, English Units 6-7.',
      createdBy: teacherId,
      isPublished: true,
    },
  ];

  for (const entry of diaryData) {
    await prisma.diaryEntry.create({ data: entry });
  }
  console.log('Created 5 diary entries');

  // ─── 3 School Events ─────────────────────────────────────────────
  const event1 = await prisma.schoolEvent.create({
    data: {
      title: 'Annual Sports Day 2026',
      description: 'The grand annual sports day featuring track events, team sports, and cultural performances.',
      type: 'SPORTS_DAY',
      startDate: new Date('2026-03-25T09:00:00'),
      endDate: new Date('2026-03-25T17:00:00'),
      venue: 'School Ground',
      organizer: 'Physical Education Department',
      budget: 50000,
      status: 'APPROVED',
      maxParticipants: 500,
      schoolId: school.id,
      createdBy: adminId,
    },
  });

  const event2 = await prisma.schoolEvent.create({
    data: {
      title: 'Science & Technology Workshop',
      description: 'Hands-on workshop covering robotics, AI basics, and environmental science projects for students of Class 9-12.',
      type: 'WORKSHOP',
      startDate: new Date('2026-04-10T10:00:00'),
      endDate: new Date('2026-04-10T16:00:00'),
      venue: 'Computer Lab & Science Block',
      organizer: 'Science Department',
      budget: 15000,
      status: 'PLANNED',
      maxParticipants: 100,
      schoolId: school.id,
      createdBy: adminId,
    },
  });

  const event3 = await prisma.schoolEvent.create({
    data: {
      title: 'Annual Cultural Fest — Rang Tarang',
      description: 'Annual cultural extravaganza showcasing student talents in music, dance, drama, and art.',
      type: 'CULTURAL',
      startDate: new Date('2026-04-20T11:00:00'),
      endDate: new Date('2026-04-21T19:00:00'),
      venue: 'School Auditorium',
      organizer: 'Cultural Committee',
      budget: 80000,
      status: 'PLANNED',
      maxParticipants: 600,
      schoolId: school.id,
      createdBy: adminId,
    },
  });

  // Add registrations for events
  if (teacher) {
    await prisma.eventRegistration.create({
      data: { eventId: event1.id, userId: teacher.id, role: 'COORDINATOR', status: 'CONFIRMED' },
    });
    await prisma.eventRegistration.create({
      data: { eventId: event2.id, userId: teacher.id, role: 'VOLUNTEER', status: 'REGISTERED' },
    });
  }
  if (admin) {
    await prisma.eventRegistration.create({
      data: { eventId: event1.id, userId: admin.id, role: 'COORDINATOR', status: 'CONFIRMED' },
    });
    await prisma.eventRegistration.create({
      data: { eventId: event3.id, userId: admin.id, role: 'COORDINATOR', status: 'CONFIRMED' },
    });
  }
  console.log('Created 3 school events with registrations');

  // Create a completed academic transition record (2025-26 → 2026-27)
  const prevSession = await prisma.academicSession.create({
    data: {
      name: '2025-26',
      startDate: new Date('2025-04-01'),
      endDate: new Date('2026-03-31'),
      status: 'COMPLETED',
      schoolId: school.id,
    },
  });
  if (adminId && adminId !== 'system') {
    await prisma.academicTransition.create({
      data: {
        fromSessionId: prevSession.id,
        toSessionId: session.id,
        status: 'COMPLETED',
        startedBy: adminId,
        completedAt: new Date('2026-04-02'),
        studentsPromoted: 0,
        studentsRetained: 0,
        sectionsCreated: 0,
        errors: [],
        schoolId: school.id,
      },
    });
    console.log('Created 1 completed academic transition record (2025-26 → 2026-27)');
  }

  console.log('Seed complete!');
  console.log(`School: ${school.name} (${school.id})`);
  console.log(`Session: ${session.name}`);
  console.log('Admin login: admin@medicaps.edu.in / admin123');
  console.log('Teacher login: teacher@medicaps.edu.in / teacher123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
