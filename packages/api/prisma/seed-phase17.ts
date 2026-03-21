import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding phase 17 data (diary + events)...');

  // Find existing school
  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  // Find admin and teacher
  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const teacher = await prisma.user.findFirst({ where: { role: 'CLASS_TEACHER', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';
  const teacherId = teacher?.id ?? adminId;

  // Find class 10 section A
  const class10 = await prisma.class.findFirst({ where: { grade: 10, schoolId: school.id } });
  if (!class10) throw new Error('Class 10 not found');

  const sectionA = await prisma.section.findFirst({ where: { classId: class10.id, name: 'A' } });

  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  // ─── 5 Diary Entries ─────────────────────────────────────────────
  const diaryData = [
    {
      classId: class10.id,
      sectionId: sectionA?.id,
      date: new Date(todayStr),
      type: 'HOMEWORK',
      subject: 'Mathematics',
      content: 'Complete exercises 5.1 to 5.5 from Chapter 5 (Arithmetic Progressions). Show full working.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10.id,
      sectionId: sectionA?.id,
      date: new Date(todayStr),
      type: 'CLASSWORK',
      subject: 'Science',
      content: 'Lab activity: Study of osmosis using potato strips in different salt concentrations. Write observations.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10.id,
      date: new Date(todayStr),
      type: 'CIRCULAR',
      content: 'Annual Sports Day is scheduled on 25th March 2026. Students participating must register with the PE teacher by 22nd March.',
      createdBy: adminId,
      isPublished: true,
    },
    {
      classId: class10.id,
      sectionId: sectionA?.id,
      date: new Date(todayStr),
      type: 'NOTE',
      subject: 'English',
      content: 'Chapter 7: "The Necklace" by Guy de Maupassant. Read and prepare summary for discussion tomorrow.',
      createdBy: teacherId,
      isPublished: true,
    },
    {
      classId: class10.id,
      date: new Date(todayStr),
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
  console.log('Phase 17 seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
