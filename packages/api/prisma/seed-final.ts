import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== seed-final.ts: Room Booking, Meeting Minutes, Activity Logs, Hostel ===\n');

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`School: ${school.name} (${school.id})`);

  const adminUser = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!adminUser) throw new Error('No SUPER_ADMIN user found.');
  console.log(`Admin: ${adminUser.firstName} ${adminUser.lastName} (${adminUser.id})`);

  // Get Class 10A students
  const class10aStudents = await prisma.student.findMany({
    where: { class: { name: 'Class 10' }, section: { name: 'A' } },
    take: 20,
  });
  console.log(`Class 10A students: ${class10aStudents.length}`);

  // ─── 1. School Rooms ───────────────────────────────────────────────────────

  console.log('\n--- Seeding School Rooms ---');
  await prisma.roomBooking.deleteMany({});
  await prisma.schoolRoom.deleteMany({});

  const roomsData = [
    // 3 Classrooms
    { name: 'Room 101', type: 'CLASSROOM', capacity: 40, floor: 1, building: 'Main Block', hasProjector: true, hasAC: false },
    { name: 'Room 201', type: 'CLASSROOM', capacity: 40, floor: 2, building: 'Main Block', hasProjector: true, hasAC: false },
    { name: 'Room 301', type: 'CLASSROOM', capacity: 35, floor: 3, building: 'Main Block', hasProjector: false, hasAC: true },
    // 2 Labs
    { name: 'Science Lab 1', type: 'LAB', capacity: 30, floor: 1, building: 'Science Wing', hasProjector: true, hasAC: true },
    { name: 'Computer Lab', type: 'LAB', capacity: 25, floor: 2, building: 'Science Wing', hasProjector: true, hasAC: true },
    // 1 Auditorium
    { name: 'Main Auditorium', type: 'AUDITORIUM', capacity: 500, floor: 0, building: 'Main Block', hasProjector: true, hasAC: true },
    // 2 Conference
    { name: 'Conference Hall A', type: 'CONFERENCE', capacity: 20, floor: 1, building: 'Admin Block', hasProjector: true, hasAC: true },
    { name: 'Conference Hall B', type: 'CONFERENCE', capacity: 15, floor: 2, building: 'Admin Block', hasProjector: false, hasAC: true },
    // 1 Sports Hall
    { name: 'Indoor Sports Hall', type: 'SPORTS_HALL', capacity: 100, floor: 0, building: 'Sports Complex', hasProjector: false, hasAC: false },
    // 1 Library
    { name: 'Central Library', type: 'LIBRARY', capacity: 60, floor: 1, building: 'Library Block', hasProjector: true, hasAC: true },
  ];

  const rooms = [];
  for (const r of roomsData) {
    const room = await prisma.schoolRoom.create({
      data: { ...r, schoolId: school.id, isActive: true },
    });
    rooms.push(room);
    console.log(`  Created room: ${room.name} (${room.type})`);
  }

  // ─── 2. Room Bookings ─────────────────────────────────────────────────────

  console.log('\n--- Seeding Room Bookings ---');

  const today = new Date();
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(today); dayAfter.setDate(dayAfter.getDate() + 2);
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1);

  const bookingsData = [
    {
      roomId: rooms[0].id, // Room 101
      bookedBy: adminUser.id,
      date: today,
      startTime: '09:00',
      endTime: '11:00',
      purpose: 'Mathematics Special Class',
      status: 'CONFIRMED',
      attendees: 35,
    },
    {
      roomId: rooms[3].id, // Science Lab 1
      bookedBy: adminUser.id,
      date: today,
      startTime: '14:00',
      endTime: '16:00',
      purpose: 'Chemistry Practical Exam',
      status: 'CONFIRMED',
      attendees: 28,
    },
    {
      roomId: rooms[6].id, // Conference Hall A
      bookedBy: adminUser.id,
      date: tomorrow,
      startTime: '10:00',
      endTime: '12:00',
      purpose: 'Parent-Teacher Meeting',
      status: 'CONFIRMED',
      attendees: 15,
    },
    {
      roomId: rooms[5].id, // Auditorium
      bookedBy: adminUser.id,
      date: dayAfter,
      startTime: '08:00',
      endTime: '10:00',
      purpose: 'Annual Day Rehearsal',
      status: 'PENDING',
      attendees: 200,
    },
    {
      roomId: rooms[4].id, // Computer Lab
      bookedBy: adminUser.id,
      date: yesterday,
      startTime: '11:00',
      endTime: '13:00',
      purpose: 'IT Skills Workshop',
      status: 'CONFIRMED',
      attendees: 22,
      remarks: 'Please ensure all computers are powered on before session',
    },
  ];

  for (const b of bookingsData) {
    const booking = await prisma.roomBooking.create({ data: b });
    console.log(`  Booked: ${rooms.find((r) => r.id === b.roomId)?.name} on ${b.date.toDateString()} (${b.status})`);
  }

  // ─── 3. Meeting Minutes ───────────────────────────────────────────────────

  console.log('\n--- Seeding Meeting Minutes ---');
  await prisma.meetingMinutes.deleteMany({});

  const meetingsData = [
    {
      title: 'Monthly Staff Meeting – March 2026',
      meetingDate: new Date('2026-03-15'),
      startTime: '10:00',
      endTime: '12:00',
      location: 'Conference Hall A',
      type: 'STAFF',
      attendees: [
        { name: 'Principal Kumar', role: 'Principal' },
        { name: 'VP Sharma', role: 'Vice Principal' },
        { name: 'HOD Mathematics', role: 'Head of Department' },
        { name: 'HOD Science', role: 'Head of Department' },
        { name: 'HOD English', role: 'Head of Department' },
        { name: 'Accountant Mehta', role: 'Accountant' },
      ],
      agenda: [
        { item: 'Review of Q3 Academic Performance', discussion: 'Overall pass percentage is 87% which is 3% lower than last year. Need remedial classes for struggling students.', decision: 'Schedule remedial classes starting April 1st for all failing students' },
        { item: 'Annual Day Preparations', discussion: 'Discussed event schedule, student participation, and venue arrangements.', decision: 'Annual Day set for April 15th at Main Auditorium. Cultural committee formed.' },
        { item: 'Fee Revision for 2026-27', discussion: 'Management committee has proposed a 5% increase in tuition fees.', decision: 'Fee structure to be circulated to parents by March 30th' },
      ],
      actionItems: [
        { task: 'Schedule remedial classes timetable', assignedTo: 'Academic Coordinator', dueDate: '2026-03-25', status: 'PENDING' },
        { task: 'Send Annual Day invitations to parents', assignedTo: 'Admin Office', dueDate: '2026-04-01', status: 'PENDING' },
        { task: 'Prepare fee revision circular', assignedTo: 'Accountant Mehta', dueDate: '2026-03-28', status: 'IN_PROGRESS' },
      ],
      summary: 'Monthly staff meeting reviewed Q3 performance, finalized Annual Day date, and discussed fee revision for upcoming session.',
      recordedBy: adminUser.id,
      status: 'CIRCULATED',
      schoolId: school.id,
    },
    {
      title: 'PTA Meeting – Q3 Results Discussion',
      meetingDate: new Date('2026-03-18'),
      startTime: '14:00',
      endTime: '16:00',
      location: 'Main Auditorium',
      type: 'PTA',
      attendees: [
        { name: 'Principal Kumar', role: 'Principal' },
        { name: 'VP Sharma', role: 'Vice Principal' },
        { name: 'PTA President Mr. Gupta', role: 'PTA President' },
        { name: 'PTA Secretary Mrs. Patel', role: 'PTA Secretary' },
        { name: 'Parent Representatives (Class 10)', role: 'Parent' },
        { name: 'Parent Representatives (Class 9)', role: 'Parent' },
      ],
      agenda: [
        { item: 'Q3 Exam Results Overview', discussion: 'Principal presented subject-wise results. Mathematics and Science showed improvement. English needs attention.', decision: 'Extra English language sessions to be arranged' },
        { item: 'Student Safety and Security Update', discussion: 'New CCTV cameras installed. Bus GPS tracking activated. Parents appreciated the measures.', decision: 'WhatsApp group to be created for safety alerts' },
        { item: 'Upcoming Board Exams Preparation', discussion: 'Class 10 board exam schedule discussed. Mock tests planned.', decision: 'Mock tests every Saturday from April 1st to May 15th' },
      ],
      actionItems: [
        { task: 'Create parent WhatsApp safety group', assignedTo: 'Admin Office', dueDate: '2026-03-22', status: 'COMPLETED' },
        { task: 'Schedule English language sessions', assignedTo: 'HOD English', dueDate: '2026-03-25', status: 'PENDING' },
        { task: 'Prepare mock test schedule for Class 10', assignedTo: 'Academic Coordinator', dueDate: '2026-03-28', status: 'IN_PROGRESS' },
      ],
      summary: 'PTA meeting addressed Q3 results, school safety updates, and preparation plan for board exams. Parents were satisfied with school management.',
      recordedBy: adminUser.id,
      status: 'APPROVED',
      schoolId: school.id,
    },
    {
      title: 'Infrastructure Committee Meeting',
      meetingDate: new Date('2026-03-20'),
      startTime: '11:00',
      endTime: '12:30',
      location: 'Conference Hall B',
      type: 'COMMITTEE',
      attendees: [
        { name: 'Principal Kumar', role: 'Principal' },
        { name: 'VP Sharma', role: 'Vice Principal' },
        { name: 'Estate Manager Rao', role: 'Estate Manager' },
        { name: 'IT Coordinator Singh', role: 'IT Coordinator' },
        { name: 'Parent Rep Mr. Joshi', role: 'Committee Member' },
      ],
      agenda: [
        { item: 'New Science Lab Equipment Procurement', discussion: 'Reviewed quotes from 3 vendors. Recommended vendor offers best quality at ₹4.5L.', decision: 'Approve purchase from TechLab Solutions. PO to be raised.' },
        { item: 'Library Digital Catalogue System', discussion: 'Current manual system is inefficient. Proposed software costs ₹80,000.', decision: 'Approved. Implementation by May 2026.' },
        { item: 'Solar Panel Installation Proposal', discussion: 'ROI calculated at 4.5 years. Current electricity bills are ₹1.2L/month.', decision: 'Study to be submitted to management board for approval' },
      ],
      actionItems: [
        { task: 'Raise PO for Science Lab equipment', assignedTo: 'Estate Manager Rao', dueDate: '2026-03-25', status: 'PENDING' },
        { task: 'Finalize library software vendor', assignedTo: 'IT Coordinator Singh', dueDate: '2026-04-01', status: 'PENDING' },
        { task: 'Prepare solar panel ROI report for board', assignedTo: 'Estate Manager Rao', dueDate: '2026-04-10', status: 'PENDING' },
      ],
      summary: 'Infrastructure committee approved lab equipment procurement and library digitization. Solar panel proposal referred to management board.',
      recordedBy: adminUser.id,
      status: 'DRAFT',
      schoolId: school.id,
    },
  ];

  for (const m of meetingsData) {
    const meeting = await prisma.meetingMinutes.create({ data: m as any });
    console.log(`  Created meeting: "${meeting.title}" (${meeting.status})`);
  }

  // ─── 4. Activity Logs ─────────────────────────────────────────────────────

  console.log('\n--- Seeding Activity Logs (Class 10A students) ---');
  await prisma.activityLog.deleteMany({});

  if (class10aStudents.length === 0) {
    console.log('  No Class 10A students found, skipping activity logs.');
  } else {
    const activityTypes = [
      { type: 'ENROLLMENT', title: 'Enrolled in Academic Session 2025-26', description: 'Student enrolled in Class 10A for the academic session 2025-26.' },
      { type: 'ATTENDANCE', title: 'Attendance Warning Issued', description: 'Attendance dropped below 75%. Warning letter sent to parents.' },
      { type: 'GRADE', title: 'Q1 Results Published', description: 'Scored 87% in Q1 examinations. Top performer in Mathematics (95/100).' },
      { type: 'ASSESSMENT', title: 'Unit Test - Science', description: 'Completed unit test in Science. Marks: 28/30.' },
      { type: 'INCIDENT', title: 'Disciplinary Warning', description: 'Issued a verbal warning for disrupting class. Parents notified.' },
      { type: 'LEAVE', title: 'Medical Leave Approved', description: 'Student on medical leave for 3 days (fever). Leave approved by class teacher.' },
      { type: 'HOBBY', title: 'Enrolled in Chess Club', description: 'Student enrolled in the Chess hobby club for the current session.' },
      { type: 'AWARD', title: 'Best Student of the Month', description: 'Received Best Student of the Month award for February 2026. Exceptional academic and co-curricular performance.' },
      { type: 'HEALTH', title: 'Annual Health Check-up', description: 'Completed annual health check-up. All parameters normal. Height: 162cm, Weight: 54kg.' },
      { type: 'PROMOTION', title: 'Promoted to Class 11', description: 'Student successfully promoted to Class 11 Science stream based on Board Exam results.' },
      { type: 'GRADE', title: 'Q2 Results Published', description: 'Scored 91% in Q2 examinations. Improvement noted in English and Social Studies.' },
      { type: 'ASSESSMENT', title: 'Half-Yearly Exam Completed', description: 'Half-yearly examinations completed. Total: 432/500 (86.4%). Rank: 3rd in class.' },
      { type: 'ATTENDANCE', title: 'Perfect Attendance Week', description: 'Achieved perfect attendance for the entire month of January 2026.' },
      { type: 'HOBBY', title: 'Won Inter-School Chess Tournament', description: 'Represented school in inter-school chess tournament and won 2nd place.' },
      { type: 'INCIDENT', title: 'Commendation for Helping Peer', description: 'Teacher commended student for helping a classmate who was struggling with Mathematics.' },
      { type: 'LEAVE', title: 'Leave for Family Function', description: 'Leave granted for 2 days for attending family wedding ceremony.' },
      { type: 'AWARD', title: 'Science Project – 1st Place', description: 'Science project on "Renewable Energy" won 1st place at district level science fair.' },
      { type: 'HEALTH', title: 'Vision Test – Referral', description: 'Annual vision test revealed slight myopia. Referred to ophthalmologist for consultation.' },
      { type: 'GRADE', title: 'Q3 Results Published', description: 'Scored 88% in Q3 examinations. Consistent performance maintained across all subjects.' },
      { type: 'ENROLLMENT', title: 'Registered for Board Exams', description: 'Student registered for Class 10 Board Examinations (CBSE) for year 2026.' },
    ];

    // Distribute entries across Class 10A students
    let entryCount = 0;
    for (let i = 0; i < activityTypes.length; i++) {
      const student = class10aStudents[i % class10aStudents.length];
      const activity = activityTypes[i];
      // Spread dates over last 6 months
      const daysAgo = Math.floor((activityTypes.length - i) * 9);
      const date = new Date();
      date.setDate(date.getDate() - daysAgo);

      await prisma.activityLog.create({
        data: {
          studentId: student.id,
          type: activity.type,
          title: activity.title,
          description: activity.description,
          date,
          metadata: { seeded: true },
        },
      });
      entryCount++;
    }
    console.log(`  Created ${entryCount} activity log entries for Class 10A students.`);
  }

  // ─── 5. Hostel Rooms + Allocations ────────────────────────────────────────

  console.log('\n--- Seeding Hostel Rooms & Allocations ---');
  await prisma.hostelAllocation.deleteMany({});
  await prisma.hostelRoom.deleteMany({});

  const hostelRoomsData = [
    { roomNumber: 'H-101', block: 'Boys Block A', floor: 1, capacity: 4, type: 'DORMITORY', amenities: ['Fan', 'Attached Bathroom', 'Study Table'], schoolId: school.id },
    { roomNumber: 'H-102', block: 'Boys Block A', floor: 1, capacity: 4, type: 'DORMITORY', amenities: ['Fan', 'Attached Bathroom', 'Study Table'], schoolId: school.id },
    { roomNumber: 'H-201', block: 'Girls Block B', floor: 2, capacity: 4, type: 'SHARED', amenities: ['Fan', 'AC', 'Attached Bathroom', 'Study Table'], schoolId: school.id },
    { roomNumber: 'H-202', block: 'Girls Block B', floor: 2, capacity: 2, type: 'SHARED', amenities: ['AC', 'Attached Bathroom', 'Study Table', 'Wardrobe'], schoolId: school.id },
    { roomNumber: 'H-301', block: 'Boys Block A', floor: 3, capacity: 1, type: 'SINGLE', amenities: ['AC', 'Attached Bathroom', 'Study Table', 'Wardrobe', 'TV'], schoolId: school.id },
  ];

  const hostelRooms = [];
  for (const r of hostelRoomsData) {
    const room = await prisma.hostelRoom.create({ data: r as any });
    hostelRooms.push(room);
    console.log(`  Created hostel room: ${room.roomNumber} (${room.block})`);
  }

  // Allocate some Class 10A students
  if (class10aStudents.length >= 5) {
    const allocations = [
      { roomId: hostelRooms[0].id, studentId: class10aStudents[0].id, bedNumber: 1, startDate: new Date('2025-06-01'), status: 'ACTIVE' },
      { roomId: hostelRooms[0].id, studentId: class10aStudents[1].id, bedNumber: 2, startDate: new Date('2025-06-01'), status: 'ACTIVE' },
      { roomId: hostelRooms[1].id, studentId: class10aStudents[2].id, bedNumber: 1, startDate: new Date('2025-06-01'), status: 'ACTIVE' },
      { roomId: hostelRooms[2].id, studentId: class10aStudents[3].id, bedNumber: 1, startDate: new Date('2025-07-15'), status: 'ACTIVE' },
      { roomId: hostelRooms[3].id, studentId: class10aStudents[4].id, bedNumber: 1, startDate: new Date('2025-06-01'), status: 'ACTIVE' },
    ];

    for (const alloc of allocations) {
      await prisma.hostelAllocation.create({ data: alloc as any });
      console.log(`  Allocated student ${alloc.studentId.slice(0, 8)}... to ${hostelRooms.find((r) => r.id === alloc.roomId)?.roomNumber}`);
    }
  } else {
    console.log('  Not enough Class 10A students for allocations, skipping.');
  }

  console.log('\n=== seed-final.ts complete! ===');
}

main().catch(console.error).finally(() => prisma.$disconnect());
