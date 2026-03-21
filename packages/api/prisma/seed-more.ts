import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding Phase 12 Data (Health, Inventory, Transport Billing, Certificates, Feedback) ===\n');

  // ─── Fetch base data ─────────────────────────────────────────────────────

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`School: ${school.name}`);

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN' } });
  if (!admin) throw new Error('No admin user found.');

  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) throw new Error('No active session found.');

  // Get Class 10A students
  const class10AStudents = await prisma.student.findMany({
    where: { section: { name: 'A' }, class: { grade: 10 } },
    take: 12,
  });

  // Get all students for other seed data
  const allStudents = await prisma.student.findMany({ take: 20 });

  const routes = await prisma.route.findMany({ take: 3 });

  const teachers = await prisma.user.findMany({
    where: { role: 'CLASS_TEACHER' },
    take: 5,
  });

  const subjects = await prisma.subject.findMany({ take: 5 });
  const classes = await prisma.class.findMany({ where: { grade: 10 }, take: 1 });

  console.log(`Found: ${class10AStudents.length} Class 10A students, ${allStudents.length} total students`);
  console.log(`Found: ${routes.length} routes, ${teachers.length} teachers`);

  // ─── 1. Health Records (10 for Class 10A students) ─────────────────────────

  console.log('\n--- Seeding Health Records ---');

  // Clear existing
  await prisma.healthRecord.deleteMany({});
  await prisma.healthIncident.deleteMany({});

  const bloodGroups = ['A+', 'B+', 'O+', 'AB+', 'A-', 'B-', 'O-', 'AB-'];
  const allergyOptions = [
    ['Peanuts', 'Dust'],
    ['Penicillin'],
    ['Shellfish', 'Latex'],
    ['Pollen'],
    [],
    ['Dairy', 'Eggs'],
    [],
    ['Aspirin'],
    ['Mold'],
    [],
  ];
  const conditionOptions = [
    ['Asthma'],
    [],
    ['Type 1 Diabetes'],
    [],
    ['Epilepsy'],
    [],
    [],
    ['Hypertension'],
    [],
    [],
  ];
  const medicationOptions = [
    ['Salbutamol Inhaler'],
    [],
    ['Insulin'],
    [],
    ['Levetiracetam'],
    [],
    [],
    ['Amlodipine'],
    [],
    [],
  ];

  const studentsToSeed = class10AStudents.slice(0, 10);
  const healthRecords: any[] = [];

  for (let i = 0; i < studentsToSeed.length; i++) {
    const student = studentsToSeed[i];
    const record = await prisma.healthRecord.create({
      data: {
        studentId: student.id,
        bloodGroup: bloodGroups[i % bloodGroups.length],
        height: 150 + (i * 2.5),
        weight: 45 + (i * 2),
        allergies: allergyOptions[i] || [],
        conditions: conditionOptions[i] || [],
        medications: medicationOptions[i] || [],
        emergencyContact: `Parent of Student ${i + 1}`,
        emergencyPhone: `98100${(10001 + i).toString().padStart(5, '0')}`,
        lastCheckupDate: new Date(`2026-0${(i % 9) + 1}-15`),
        doctorName: i % 3 === 0 ? 'Dr. Ramesh Gupta' : i % 3 === 1 ? 'Dr. Sunita Joshi' : 'Dr. Anil Sharma',
        doctorPhone: `73100${(20001 + i).toString().padStart(5, '0')}`,
        notes: i === 2 ? 'Carries insulin pen at all times. Needs refrigerator access.' :
               i === 4 ? 'Has seizure action plan on file. Do not leave alone during episode.' : null,
        updatedBy: admin.id,
      },
    });
    healthRecords.push(record);
    console.log(`  Created health record for student ${i + 1} (${record.bloodGroup})`);
  }

  // ─── 2. Health Incidents (3) ────────────────────────────────────────────────

  console.log('\n--- Seeding Health Incidents ---');

  const incidentData = [
    {
      studentId: studentsToSeed[0]?.id || allStudents[0]?.id,
      date: new Date('2026-03-10'),
      type: 'FEVER',
      description: 'Student reported high fever of 102°F during third period. Was resting in sick room.',
      actionTaken: 'Given paracetamol, temperature monitored. Sent home after parent arrived.',
      parentNotified: true,
      sentHome: true,
      reportedBy: admin.id,
    },
    {
      studentId: studentsToSeed[1]?.id || allStudents[1]?.id,
      date: new Date('2026-03-14'),
      type: 'INJURY',
      description: 'Minor cut on right hand during craft class. Bleeding was controlled.',
      actionTaken: 'First aid administered. Wound cleaned, antiseptic applied, and bandaged.',
      parentNotified: false,
      sentHome: false,
      reportedBy: admin.id,
    },
    {
      studentId: studentsToSeed[2]?.id || allStudents[2]?.id,
      date: new Date('2026-03-18'),
      type: 'ALLERGY_REACTION',
      description: 'Student showed mild allergic reaction — hives on arms — after lunch.',
      actionTaken: 'Antihistamine administered from emergency kit. Supervised for 30 minutes. Stable.',
      parentNotified: true,
      sentHome: false,
      reportedBy: admin.id,
    },
  ];

  for (const inc of incidentData) {
    if (!inc.studentId) continue;
    await prisma.healthIncident.create({ data: inc });
    console.log(`  Created incident: ${inc.type} on ${inc.date.toDateString()}`);
  }

  // ─── 3. Inventory Items (20) ────────────────────────────────────────────────

  console.log('\n--- Seeding Inventory Items ---');

  await prisma.inventoryItem.deleteMany({});
  await prisma.inventoryLog.deleteMany({});

  const inventoryData = [
    // Furniture
    { name: 'Student Chair', category: 'FURNITURE', description: 'Plastic moulded student chair', quantity: 120, location: 'Various Classrooms', condition: 'GOOD', purchaseDate: new Date('2024-04-01'), purchasePrice: 850, supplier: 'Modi Furniture House', barcode: 'INV-FURN-001' },
    { name: 'Student Desk', category: 'FURNITURE', description: 'Wooden writing desk', quantity: 60, location: 'Various Classrooms', condition: 'GOOD', purchaseDate: new Date('2024-04-01'), purchasePrice: 2200, supplier: 'Modi Furniture House', barcode: 'INV-FURN-002' },
    { name: 'Teacher Chair (High Back)', category: 'FURNITURE', description: 'Ergonomic teacher chair', quantity: 25, location: 'Staff Room', condition: 'GOOD', purchaseDate: new Date('2024-05-15'), purchasePrice: 4500, supplier: 'Premier Office Furniture', barcode: 'INV-FURN-003' },
    { name: 'Whiteboard (6x4 ft)', category: 'FURNITURE', description: 'Magnetic whiteboard', quantity: 18, location: 'Classrooms', condition: 'GOOD', purchaseDate: new Date('2023-04-01'), purchasePrice: 3800, supplier: 'National Boards Co.', barcode: 'INV-FURN-004' },
    { name: 'Steel Almirah', category: 'FURNITURE', description: 'Filing cabinet almirah', quantity: 4, location: 'Admin Block', condition: 'GOOD', purchaseDate: new Date('2022-08-10'), purchasePrice: 8500, supplier: 'Godrej', barcode: 'INV-FURN-005' },
    // Electronics
    { name: 'Desktop Computer', category: 'ELECTRONICS', description: 'Dell OptiPlex 3080, i5, 8GB RAM, 256GB SSD', quantity: 30, location: 'Computer Lab', condition: 'GOOD', purchaseDate: new Date('2023-06-01'), purchasePrice: 38000, supplier: 'Dell Technologies', warrantyExpiry: new Date('2026-06-01'), barcode: 'INV-ELEC-001' },
    { name: 'Projector', category: 'ELECTRONICS', description: 'BenQ 3500 lumens DLP projector', quantity: 12, location: 'Smart Classrooms', condition: 'GOOD', purchaseDate: new Date('2023-09-01'), purchasePrice: 45000, supplier: 'BenQ India', warrantyExpiry: new Date('2026-09-01'), barcode: 'INV-ELEC-002' },
    { name: 'Interactive Smartboard', category: 'ELECTRONICS', description: '75-inch 4K interactive panel', quantity: 6, location: 'Smart Classrooms 1-6', condition: 'NEW', purchaseDate: new Date('2025-01-15'), purchasePrice: 185000, supplier: 'Promethean', warrantyExpiry: new Date('2028-01-15'), barcode: 'INV-ELEC-003' },
    { name: 'Laser Printer', category: 'ELECTRONICS', description: 'HP LaserJet Pro M404dn', quantity: 3, location: 'Office & Library', condition: 'GOOD', purchaseDate: new Date('2024-02-20'), purchasePrice: 22000, supplier: 'HP India', warrantyExpiry: new Date('2026-02-20'), barcode: 'INV-ELEC-004' },
    { name: 'CCTV Camera Kit', category: 'ELECTRONICS', description: '16-camera surveillance system with DVR', quantity: 2, location: 'Server Room', condition: 'GOOD', purchaseDate: new Date('2023-11-01'), purchasePrice: 55000, supplier: 'Hikvision', warrantyExpiry: new Date('2026-11-01'), barcode: 'INV-ELEC-005' },
    // Sports
    { name: 'Cricket Bat (Kashmir Willow)', category: 'SPORTS', description: 'Full-size cricket bat', quantity: 8, location: 'Sports Room', condition: 'GOOD', purchaseDate: new Date('2024-08-01'), purchasePrice: 1200, supplier: 'SS Cricket', barcode: 'INV-SPRT-001' },
    { name: 'Football', category: 'SPORTS', description: 'FIFA approved football, size 5', quantity: 6, location: 'Sports Room', condition: 'GOOD', purchaseDate: new Date('2024-08-01'), purchasePrice: 850, supplier: 'Nivia Sports', barcode: 'INV-SPRT-002' },
    { name: 'Badminton Racquet Set', category: 'SPORTS', description: 'Set of 2 racquets with shuttlecocks', quantity: 10, location: 'Sports Room', condition: 'FAIR', purchaseDate: new Date('2023-04-01'), purchasePrice: 600, supplier: 'Yonex', barcode: 'INV-SPRT-003' },
    { name: 'Table Tennis Table', category: 'SPORTS', description: 'Regulation size TT table with net', quantity: 2, location: 'Indoor Games Hall', condition: 'GOOD', purchaseDate: new Date('2022-12-01'), purchasePrice: 18000, supplier: 'Stag Sports', barcode: 'INV-SPRT-004' },
    // Lab Equipment
    { name: 'Microscope (Compound)', category: 'LAB_EQUIPMENT', description: 'Student grade compound microscope, 40x-1000x', quantity: 15, location: 'Biology Lab', condition: 'GOOD', purchaseDate: new Date('2023-04-01'), purchasePrice: 8500, supplier: 'Labhotics India', barcode: 'INV-LAB-001' },
    { name: 'Bunsen Burner', category: 'LAB_EQUIPMENT', description: 'Gas bunsen burner for chemistry lab', quantity: 12, location: 'Chemistry Lab', condition: 'GOOD', purchaseDate: new Date('2023-04-01'), purchasePrice: 1200, supplier: 'Tarsons Products', barcode: 'INV-LAB-002' },
    { name: 'Digital Weighing Balance', category: 'LAB_EQUIPMENT', description: 'Precision balance 0.01g accuracy', quantity: 4, location: 'Chemistry Lab', condition: 'GOOD', purchaseDate: new Date('2024-03-15'), purchasePrice: 12000, supplier: 'Sartorius', barcode: 'INV-LAB-003' },
    // Stationery
    { name: 'A4 Printing Paper (Ream)', category: 'STATIONERY', description: 'ITC Classique 75 GSM A4 paper', quantity: 3, location: 'Stationery Store', condition: 'NEW', purchaseDate: new Date('2026-03-01'), purchasePrice: 320, supplier: 'ITC Paperboards', barcode: 'INV-STAT-001' },
    { name: 'Marker Pen Set (Whiteboard)', category: 'STATIONERY', description: 'Camlin whiteboard markers, 4 colors', quantity: 8, location: 'Stationery Store', condition: 'NEW', purchaseDate: new Date('2026-02-15'), purchasePrice: 180, supplier: 'Camlin Ltd.', barcode: 'INV-STAT-002' },
    // Vehicle
    { name: 'School Bus (41-Seater)', category: 'VEHICLE', description: 'Tata Starbus Ultra 41-seater CNG school bus', quantity: 3, location: 'Parking Area', condition: 'GOOD', purchaseDate: new Date('2022-04-01'), purchasePrice: 3200000, supplier: 'Tata Motors', warrantyExpiry: new Date('2025-04-01'), barcode: 'INV-VEHI-001' },
  ];

  const createdItems: any[] = [];
  for (const item of inventoryData) {
    const { barcode, ...rest } = item;
    const created = await prisma.inventoryItem.create({
      data: { ...rest, schoolId: school.id, barcode },
    });
    createdItems.push(created);
    // Log the ADDED action
    await prisma.inventoryLog.create({
      data: {
        itemId: created.id,
        action: 'ADDED',
        quantity: created.quantity,
        performedBy: admin.id,
        remarks: 'Initial stock entry',
      },
    });
  }
  console.log(`  Created ${createdItems.length} inventory items`);

  // ─── 4. Inventory Logs (5 additional) ───────────────────────────────────────

  console.log('\n--- Seeding Inventory Logs ---');

  const additionalLogs = [
    {
      itemId: createdItems[0].id, // Student Chair
      action: 'ASSIGNED',
      quantity: 30,
      toLocation: 'Class 10A',
      remarks: 'Assigned 30 chairs to Class 10A for new academic year',
      performedBy: admin.id,
    },
    {
      itemId: createdItems[5].id, // Desktop Computer
      action: 'REPAIRED',
      quantity: 2,
      fromLocation: 'Computer Lab',
      toLocation: 'Computer Lab',
      remarks: 'Two systems repaired after RAM failure',
      performedBy: admin.id,
    },
    {
      itemId: createdItems[6].id, // Projector
      action: 'ASSIGNED',
      quantity: 1,
      toLocation: 'Room 12 - Physics',
      remarks: 'Assigned to physics classroom',
      performedBy: admin.id,
    },
    {
      itemId: createdItems[17].id, // A4 Paper
      action: 'QUANTITY_UPDATED',
      quantity: 5,
      remarks: 'Stock updated after purchase of 5 more reams',
      performedBy: admin.id,
    },
    {
      itemId: createdItems[14].id, // Microscope
      action: 'RETURNED',
      quantity: 2,
      fromLocation: 'Biology Lab Prep Room',
      toLocation: 'Biology Lab',
      remarks: 'Returned from maintenance check',
      performedBy: admin.id,
    },
  ];

  for (const log of additionalLogs) {
    await prisma.inventoryLog.create({ data: log });
  }
  console.log(`  Created 5 additional inventory logs`);

  // ─── 5. Transport Billing (10 records) ─────────────────────────────────────

  console.log('\n--- Seeding Transport Billing ---');

  await prisma.transportBilling.deleteMany({});

  if (routes.length > 0 && allStudents.length > 0) {
    const month = 3; // March
    const year = 2026;
    const amount = 1500;

    let billsCreated = 0;
    for (let i = 0; i < Math.min(10, allStudents.length); i++) {
      const student = allStudents[i];
      const route = routes[i % routes.length];
      const status = i < 5 ? 'PAID' : i < 8 ? 'PENDING' : 'WAIVED';

      try {
        await prisma.transportBilling.create({
          data: {
            studentId: student.id,
            routeId: route.id,
            month,
            year,
            amount,
            status,
            paidAt: status === 'PAID' ? new Date(`${year}-03-${10 + i}`) : null,
            receiptNo: status === 'PAID' ? `RCPT-${year}03-${(1001 + i).toString()}` : null,
            remarks: status === 'WAIVED' ? 'Fee concession granted by management' : null,
          },
        });
        billsCreated++;
      } catch (e: any) {
        if (!e.message?.includes('Unique constraint')) {
          console.error('  Error creating billing:', e.message);
        }
      }
    }
    console.log(`  Created ${billsCreated} transport billing records`);
  } else {
    console.log('  Skipped transport billing (no routes or students)');
  }

  // ─── 6. Certificates (5) ────────────────────────────────────────────────────

  console.log('\n--- Seeding Certificates ---');

  // Clear existing
  try {
    await prisma.certificate.deleteMany({});
  } catch {}

  const certData = [
    {
      studentId: studentsToSeed[0]?.id || allStudents[0]?.id,
      type: 'MERIT',
      title: 'Academic Excellence Award',
      description: 'Awarded for outstanding academic performance in the Annual Examination 2025-26.',
      issuedDate: new Date('2026-03-15'),
      issuedBy: `${admin.firstName} ${admin.lastName}`,
      serialNumber: `CERT-MERIT-2026-0001`,
      status: 'ISSUED',
    },
    {
      studentId: studentsToSeed[1]?.id || allStudents[1]?.id,
      type: 'SPORTS',
      title: 'Inter-School Athletics Champion',
      description: 'Awarded for winning the 100m sprint event at the Inter-School Athletic Meet 2026.',
      issuedDate: new Date('2026-02-20'),
      issuedBy: `${admin.firstName} ${admin.lastName}`,
      serialNumber: `CERT-SPORT-2026-0001`,
      status: 'ISSUED',
    },
    {
      studentId: studentsToSeed[2]?.id || allStudents[2]?.id,
      type: 'PARTICIPATION',
      title: 'Science Exhibition Participation',
      description: 'For active participation in the Annual Science Exhibition 2025-26.',
      issuedDate: new Date('2026-01-25'),
      issuedBy: `${admin.firstName} ${admin.lastName}`,
      serialNumber: `CERT-PART-2026-0001`,
      status: 'ISSUED',
    },
    {
      studentId: studentsToSeed[3]?.id || allStudents[3]?.id,
      type: 'CONDUCT',
      title: 'Best Discipline Award',
      description: 'Awarded for exemplary conduct and discipline throughout the academic year 2025-26.',
      issuedDate: new Date('2026-03-15'),
      issuedBy: `${admin.firstName} ${admin.lastName}`,
      serialNumber: `CERT-COND-2026-0001`,
      status: 'ISSUED',
    },
    {
      studentId: studentsToSeed[4]?.id || allStudents[4]?.id,
      type: 'ACHIEVEMENT',
      title: 'Mathematics Olympiad Excellence',
      description: 'Awarded for securing 2nd position in the State Mathematics Olympiad 2025.',
      issuedDate: new Date('2026-03-15'),
      issuedBy: `${admin.firstName} ${admin.lastName}`,
      serialNumber: `CERT-ACHI-2026-0001`,
      status: 'ISSUED',
    },
  ];

  let certsCreated = 0;
  for (const cert of certData) {
    if (!cert.studentId) continue;
    try {
      await prisma.certificate.create({ data: cert });
      certsCreated++;
      console.log(`  Created certificate: ${cert.title}`);
    } catch (e: any) {
      if (!e.message?.includes('Unique constraint')) {
        console.error('  Error creating certificate:', e.message);
      }
    }
  }

  // ─── 7. Feedback Entries (5) ─────────────────────────────────────────────────

  console.log('\n--- Seeding Feedback Entries ---');

  try {
    await prisma.feedback.deleteMany({});
  } catch {}

  const parentUsers = await prisma.user.findMany({ where: { role: 'PARENT' }, take: 5 });
  const studentUsers = await prisma.user.findMany({ where: { role: 'STUDENT' }, take: 5 });
  const teacherUsers = await prisma.user.findMany({ where: { role: 'CLASS_TEACHER' }, take: 3 });

  const feedbackSenders = [
    ...(parentUsers.length > 0 ? parentUsers : [admin]),
    ...(studentUsers.length > 0 ? studentUsers.slice(0, 2) : [admin]),
  ];

  const feedbackData = [
    {
      type: 'PARENT_FEEDBACK',
      fromUserId: feedbackSenders[0]?.id || admin.id,
      toUserId: teacherUsers[0]?.id || admin.id,
      rating: 5,
      comment: 'The class teacher is extremely dedicated and communicates progress regularly. Very happy with the teaching approach.',
      isAnonymous: false,
      academicSessionId: session.id,
    },
    {
      type: 'PARENT_FEEDBACK',
      fromUserId: feedbackSenders[1]?.id || admin.id,
      toUserId: teacherUsers[0]?.id || admin.id,
      rating: 4,
      comment: 'Good teaching but could give more homework feedback. Overall satisfied with the class management.',
      isAnonymous: false,
      academicSessionId: session.id,
    },
    {
      type: 'STUDENT_FEEDBACK',
      fromUserId: feedbackSenders[2]?.id || admin.id,
      toUserId: teacherUsers[1]?.id || admin.id,
      subjectId: subjects[0]?.id,
      rating: 4,
      comment: 'Math classes are engaging. The teacher explains concepts clearly with many examples.',
      isAnonymous: true,
      academicSessionId: session.id,
    },
    {
      type: 'COURSE_FEEDBACK',
      fromUserId: feedbackSenders[3]?.id || admin.id,
      classId: classes[0]?.id,
      rating: 4,
      comment: 'The curriculum is well-structured. Science practical sessions are very helpful for understanding concepts.',
      isAnonymous: false,
      academicSessionId: session.id,
    },
    {
      type: 'TEACHER_FEEDBACK',
      fromUserId: admin.id,
      toUserId: teacherUsers[0]?.id || admin.id,
      rating: 5,
      comment: 'The teacher consistently delivers excellent results and maintains great student engagement. Highly recommended for senior grades.',
      isAnonymous: false,
      academicSessionId: session.id,
    },
  ];

  let feedbackCreated = 0;
  for (const fb of feedbackData) {
    try {
      await prisma.feedback.create({ data: fb });
      feedbackCreated++;
    } catch (e: any) {
      console.error('  Error creating feedback:', e.message);
    }
  }
  console.log(`  Created ${feedbackCreated} feedback entries`);

  // ─── Summary ──────────────────────────────────────────────────────────────────

  console.log('\n══════════════════════════════════════════════');
  console.log('  Seed Complete — Phase 12 Summary');
  console.log('══════════════════════════════════════════════');
  console.log(`  Health Records   : ${healthRecords.length}`);
  console.log(`  Health Incidents : 3`);
  console.log(`  Inventory Items  : ${createdItems.length}`);
  console.log(`  Inventory Logs   : ${createdItems.length + 5}`);
  console.log(`  Transport Bills  : 10`);
  console.log(`  Certificates     : ${certsCreated}`);
  console.log(`  Feedback Entries : ${feedbackCreated}`);
  console.log('══════════════════════════════════════════════');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
