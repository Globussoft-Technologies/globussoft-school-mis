import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 15: Hostel, Payroll, Grievances...');

  // Get the first school
  const school = await prisma.school.findFirst();
  if (!school) {
    throw new Error('No school found. Run the main seed first.');
  }
  console.log(`Using school: ${school.name} (${school.id})`);

  // Get some users for payroll
  const users = await prisma.user.findMany({
    where: { schoolId: school.id },
    take: 10,
  });
  console.log(`Found ${users.length} users`);

  // Get some students for hostel allocations
  const students = await prisma.student.findMany({
    where: { academicSession: { schoolId: school.id } },
    take: 5,
  });
  console.log(`Found ${students.length} students`);

  // ─── Hostel Rooms ──────────────────────────────────────────────

  console.log('Creating hostel rooms...');
  const rooms = [];
  const roomDefs = [
    { roomNumber: '101', floor: 1, block: 'A', capacity: 4, type: 'SHARED' },
    { roomNumber: '102', floor: 1, block: 'A', capacity: 2, type: 'SHARED' },
    { roomNumber: '201', floor: 2, block: 'A', capacity: 1, type: 'SINGLE' },
    { roomNumber: '101', floor: 1, block: 'B', capacity: 6, type: 'DORMITORY' },
    { roomNumber: '102', floor: 1, block: 'B', capacity: 4, type: 'SHARED' },
  ];

  for (const def of roomDefs) {
    try {
      const room = await prisma.hostelRoom.upsert({
        where: {
          roomNumber_block_schoolId: {
            roomNumber: def.roomNumber,
            block: def.block,
            schoolId: school.id,
          },
        },
        create: {
          ...def,
          amenities: ['Fan', 'Study Table'],
          schoolId: school.id,
        },
        update: {},
      });
      rooms.push(room);
      console.log(`  Room ${def.block}-${def.roomNumber} (${def.type})`);
    } catch (e) {
      console.log(`  Skipped room ${def.block}-${def.roomNumber}: already exists`);
    }
  }

  // ─── Hostel Allocations ────────────────────────────────────────

  if (students.length > 0 && rooms.length > 0) {
    console.log('Creating hostel allocations...');
    const allocCount = Math.min(5, students.length);
    for (let i = 0; i < allocCount; i++) {
      const student = students[i];
      const room = rooms[i % rooms.length];

      // Check existing allocation
      const existing = await prisma.hostelAllocation.findFirst({
        where: { studentId: student.id, status: 'ACTIVE' },
      });
      if (existing) {
        console.log(`  Student ${student.id} already allocated — skipping`);
        continue;
      }

      // Check room capacity
      const currentRoom = await prisma.hostelRoom.findUnique({ where: { id: room.id } });
      if (!currentRoom || currentRoom.occupied >= currentRoom.capacity) {
        console.log(`  Room ${room.block}-${room.roomNumber} is full — skipping`);
        continue;
      }

      try {
        await prisma.$transaction([
          prisma.hostelAllocation.create({
            data: {
              studentId: student.id,
              roomId: room.id,
              bedNumber: i + 1,
              startDate: new Date('2026-04-01'),
              status: 'ACTIVE',
            },
          }),
          prisma.hostelRoom.update({
            where: { id: room.id },
            data: { occupied: { increment: 1 } },
          }),
        ]);
        console.log(`  Allocated student ${student.id} to room ${room.block}-${room.roomNumber}`);
      } catch (e) {
        console.log(`  Failed to allocate student ${student.id}: ${e}`);
      }
    }
  } else {
    console.log('  No students found — skipping allocations');
  }

  // ─── Salary Structures ────────────────────────────────────────

  console.log('Creating salary structures...');
  const structureDefs = [
    { role: 'DIRECTOR', basicSalary: 80000, hra: 20000, da: 8000, ta: 5000, pf: 9600, tax: 12000 },
    { role: 'CLASS_TEACHER', basicSalary: 35000, hra: 8750, da: 3500, ta: 2000, pf: 4200, tax: 3500 },
    { role: 'SUBJECT_TEACHER', basicSalary: 30000, hra: 7500, da: 3000, ta: 2000, pf: 3600, tax: 2800 },
    { role: 'ACCOUNTANT', basicSalary: 28000, hra: 7000, da: 2800, ta: 1500, pf: 3360, tax: 2500 },
    { role: 'ACADEMIC_COORDINATOR', basicSalary: 50000, hra: 12500, da: 5000, ta: 3000, pf: 6000, tax: 7000 },
  ];

  for (const def of structureDefs) {
    try {
      await prisma.salaryStructure.upsert({
        where: { role_schoolId: { role: def.role, schoolId: school.id } },
        create: { ...def, schoolId: school.id },
        update: { basicSalary: def.basicSalary, hra: def.hra, da: def.da, ta: def.ta, pf: def.pf, tax: def.tax },
      });
      console.log(`  Structure for ${def.role}: Basic ₹${def.basicSalary}`);
    } catch (e) {
      console.log(`  Failed structure ${def.role}: ${e}`);
    }
  }

  // ─── Payroll Records ──────────────────────────────────────────

  console.log('Creating payroll records...');
  const month = 3;
  const year = 2026;
  const structures = await prisma.salaryStructure.findMany({ where: { schoolId: school.id } });
  const structureMap = new Map(structures.map((s) => [s.role, s]));

  let payrollCreated = 0;
  for (const user of users) {
    if (payrollCreated >= 10) break;
    const structure = structureMap.get(user.role);
    if (!structure) continue;

    const allowances = structure.hra + structure.da + structure.ta;
    const deductions = structure.pf + structure.tax;
    const netSalary = structure.basicSalary + allowances - deductions;
    const statuses = ['DRAFT', 'APPROVED', 'PAID'];
    const status = statuses[payrollCreated % 3];

    try {
      await prisma.payrollRecord.upsert({
        where: { userId_month_year: { userId: user.id, month, year } },
        create: {
          userId: user.id,
          month,
          year,
          basicSalary: structure.basicSalary,
          allowances,
          deductions,
          netSalary,
          status,
          paidAt: status === 'PAID' ? new Date('2026-03-31') : null,
          remarks: `Auto-generated for ${month}/${year}`,
        },
        update: {},
      });
      payrollCreated++;
      console.log(`  Payroll for ${user.firstName} ${user.lastName} (${user.role}): ₹${netSalary} [${status}]`);
    } catch (e) {
      console.log(`  Skipped payroll for ${user.id}: ${e}`);
    }
  }

  // ─── Grievances ───────────────────────────────────────────────

  console.log('Creating grievances...');
  const grievanceDefs = [
    {
      category: 'INFRASTRUCTURE',
      subject: 'Broken ceiling fan in Classroom 5A',
      description: 'The ceiling fan in classroom 5A has been non-functional for the past two weeks causing discomfort during summer.',
      priority: 'HIGH',
      status: 'OPEN',
    },
    {
      category: 'ACADEMIC',
      subject: 'Missing marks for mid-term exam',
      description: 'My marks for the Mathematics mid-term exam (Feb 2026) have not been updated on the portal yet.',
      priority: 'MEDIUM',
      status: 'IN_PROGRESS',
    },
    {
      category: 'FEE',
      subject: 'Late fee charged incorrectly',
      description: 'I paid the tuition fee on 8th March 2026 but was still charged a late fee of ₹500. Please review and refund.',
      priority: 'MEDIUM',
      status: 'RESOLVED',
      resolution: 'Payment record verified. Late fee of ₹500 reversed and credited to student account.',
    },
    {
      category: 'HOSTEL',
      subject: 'Water supply issue in Block B',
      description: 'The hot water supply in Block B has been intermittent for 3 days. Students are unable to shower properly.',
      priority: 'HIGH',
      status: 'IN_PROGRESS',
    },
    {
      category: 'BULLYING',
      subject: 'Bullying incident reported',
      description: 'A student in Class 9B is being harassed by a group of senior students during lunch break. Immediate action requested.',
      priority: 'CRITICAL',
      status: 'OPEN',
    },
  ];

  const submitter = users[0] ?? { id: 'system' };
  for (let i = 0; i < grievanceDefs.length; i++) {
    const def = grievanceDefs[i];
    const year2 = new Date().getFullYear();
    const seq = String(i + 1).padStart(4, '0');
    const ticketNumber = `GRV-${year2}-${seq}`;

    // Check if ticket exists
    const existing = await prisma.grievance.findUnique({ where: { ticketNumber } });
    if (existing) {
      console.log(`  Skipped grievance ${ticketNumber}: already exists`);
      continue;
    }

    try {
      await prisma.grievance.create({
        data: {
          ticketNumber,
          submittedBy: submitter.id,
          category: def.category,
          subject: def.subject,
          description: def.description,
          priority: def.priority,
          status: def.status,
          resolution: def.resolution ?? null,
          resolvedAt: def.status === 'RESOLVED' ? new Date() : null,
          schoolId: school.id,
        },
      });
      console.log(`  Grievance ${ticketNumber}: [${def.priority}] ${def.subject}`);
    } catch (e) {
      console.log(`  Failed grievance ${ticketNumber}: ${e}`);
    }
  }

  console.log('\nPhase 15 seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
