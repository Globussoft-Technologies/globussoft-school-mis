import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding New Modules (TC, Library, Visitors) ===\n');

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`Found school: ${school.name}`);

  const adminUser = await prisma.user.findFirst({
    where: { schoolId: school.id, role: 'SUPER_ADMIN' },
  });
  if (!adminUser) throw new Error('No admin user found.');

  const students = await prisma.student.findMany({
    include: { user: true, class: true, section: true },
    take: 5,
  });

  // ─── 1. Transfer Certificates ─────────────────────────────────────────────

  console.log('\n--- Seeding Transfer Certificates ---');

  // Clear existing
  await prisma.transferCertificate.deleteMany({});

  const year = new Date().getFullYear();
  const tcData = [
    {
      studentId: students[0]?.id || 'unknown',
      tcNumber: `TC-${year}-0001`,
      dateOfIssue: new Date(),
      reasonForLeaving: 'Parent relocation to another city',
      lastClassAttended: students[0]?.class ? `Class ${students[0].class.grade}${students[0].section ? ' ' + students[0].section.name : ''}` : 'Class 10 A',
      lastExamPassed: 'Annual Examination 2024-25',
      conductAndCharacter: 'Good',
      generalRemarks: 'Student was regular and well-behaved.',
      issuedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      status: 'DRAFT',
    },
    {
      studentId: students[1]?.id || 'unknown',
      tcNumber: `TC-${year}-0002`,
      dateOfIssue: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      reasonForLeaving: 'Admission to boarding school',
      lastClassAttended: students[1]?.class ? `Class ${students[1].class.grade}${students[1].section ? ' ' + students[1].section.name : ''}` : 'Class 9 A',
      lastExamPassed: 'Half-Yearly Examination 2024-25',
      conductAndCharacter: 'Excellent',
      generalRemarks: 'Meritorious student. Left on good terms.',
      issuedBy: `${adminUser.firstName} ${adminUser.lastName}`,
      status: 'ISSUED',
    },
  ];

  for (const tc of tcData) {
    if (tc.studentId !== 'unknown') {
      await prisma.transferCertificate.create({ data: tc });
      console.log(`  Created TC: ${tc.tcNumber} (${tc.status})`);
    }
  }

  // ─── 2. Library Books (20) ────────────────────────────────────────────────

  console.log('\n--- Seeding Library Books ---');

  await prisma.libraryIssue.deleteMany({});
  await prisma.libraryBook.deleteMany({});

  const booksData = [
    { title: 'Mathematics Class X', author: 'R.D. Sharma', isbn: '978-8121926119', category: 'TEXTBOOK', publisher: 'Dhanpat Rai', publicationYear: 2022, totalCopies: 5, location: 'Shelf A1' },
    { title: 'Science Class X', author: 'NCERT', isbn: '978-8174505613', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2023, totalCopies: 6, location: 'Shelf A2' },
    { title: 'English Literature Class X', author: 'NCERT', isbn: '978-8174505897', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2023, totalCopies: 4, location: 'Shelf A3' },
    { title: 'Social Science Class X', author: 'NCERT', isbn: '978-8174506030', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2022, totalCopies: 5, location: 'Shelf A4' },
    { title: 'Physics Part I & II', author: 'H.C. Verma', isbn: '978-8177091397', category: 'REFERENCE', publisher: 'Bharati Bhawan', publicationYear: 2021, totalCopies: 3, location: 'Shelf B1' },
    { title: 'Organic Chemistry', author: 'Morrison & Boyd', isbn: '978-0136436461', category: 'REFERENCE', publisher: 'Pearson', publicationYear: 2020, totalCopies: 2, location: 'Shelf B2' },
    { title: 'The Alchemist', author: 'Paulo Coelho', isbn: '978-0062315007', category: 'FICTION', publisher: 'HarperCollins', publicationYear: 1988, totalCopies: 3, location: 'Shelf C1' },
    { title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '978-0061935466', category: 'FICTION', publisher: 'Grand Central', publicationYear: 1960, totalCopies: 2, location: 'Shelf C1' },
    { title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '978-8173711466', category: 'NON_FICTION', publisher: 'Universities Press', publicationYear: 1999, totalCopies: 4, location: 'Shelf C2' },
    { title: 'The Diary of a Young Girl', author: 'Anne Frank', isbn: '978-0553577129', category: 'NON_FICTION', publisher: 'Bantam Books', publicationYear: 1947, totalCopies: 2, location: 'Shelf C2' },
    { title: 'Mathematics Class IX', author: 'NCERT', isbn: '978-8174505972', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2022, totalCopies: 5, location: 'Shelf A5' },
    { title: 'Biology Class XII', author: 'NCERT', isbn: '978-8174506887', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2023, totalCopies: 4, location: 'Shelf A6' },
    { title: 'Chemistry Part I & II', author: 'NCERT', isbn: '978-8174506559', category: 'TEXTBOOK', publisher: 'NCERT', publicationYear: 2023, totalCopies: 4, location: 'Shelf A7' },
    { title: 'Encyclopaedia Britannica Vol 1', author: 'Various', isbn: '978-1593392369', category: 'REFERENCE', publisher: 'Britannica', publicationYear: 2010, totalCopies: 1, location: 'Shelf B3' },
    { title: 'Oxford Dictionary', author: 'Oxford University Press', isbn: '978-0199571123', category: 'REFERENCE', publisher: 'OUP', publicationYear: 2020, totalCopies: 2, location: 'Shelf B4' },
    { title: 'Harry Potter and the Philosopher Stone', author: 'J.K. Rowling', isbn: '978-0439708180', category: 'FICTION', publisher: 'Scholastic', publicationYear: 1997, totalCopies: 3, location: 'Shelf C3' },
    { title: 'Thinking, Fast and Slow', author: 'Daniel Kahneman', isbn: '978-0374533557', category: 'NON_FICTION', publisher: 'FSG', publicationYear: 2011, totalCopies: 2, location: 'Shelf C4' },
    { title: 'Science Today (Periodical)', author: 'Various', isbn: null, category: 'PERIODICAL', publisher: 'India Today Group', publicationYear: 2025, totalCopies: 10, location: 'Periodical Rack' },
    { title: 'National Geographic (Periodical)', author: 'Various', isbn: null, category: 'PERIODICAL', publisher: 'National Geographic', publicationYear: 2025, totalCopies: 6, location: 'Periodical Rack' },
    { title: 'Computer Science with Python', author: 'Sumita Arora', isbn: '978-8177008892', category: 'TEXTBOOK', publisher: 'Dhanpat Rai', publicationYear: 2022, totalCopies: 5, location: 'Shelf A8' },
  ];

  const createdBooks: any[] = [];
  for (const b of booksData) {
    const book = await prisma.libraryBook.create({
      data: {
        ...b,
        availableCopies: b.totalCopies,
        schoolId: school.id,
      },
    });
    createdBooks.push(book);
  }
  console.log(`  Created ${createdBooks.length} books`);

  // ─── 3. Library Issues (10: 5 returned, 3 active, 2 overdue) ─────────────

  console.log('\n--- Seeding Library Issues ---');

  const borrowerIds = students.slice(0, 5).map((s) => s.userId);
  if (borrowerIds.length === 0) throw new Error('No students found to use as borrowers.');

  const today = new Date();
  const issuesData: any[] = [];

  // 5 Returned
  for (let i = 0; i < 5; i++) {
    const issueDate = new Date(today.getTime() - (20 + i) * 24 * 60 * 60 * 1000);
    const dueDate = new Date(today.getTime() - (10 + i) * 24 * 60 * 60 * 1000);
    const returnDate = new Date(today.getTime() - (12 + i) * 24 * 60 * 60 * 1000);
    issuesData.push({
      bookId: createdBooks[i].id,
      borrowerId: borrowerIds[i % borrowerIds.length],
      issueDate,
      dueDate,
      returnDate,
      status: 'RETURNED',
      fine: null,
      remarks: 'Returned in good condition',
    });
  }

  // 3 Active (issued, due in future)
  for (let i = 0; i < 3; i++) {
    const issueDate = new Date(today.getTime() - 3 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    issuesData.push({
      bookId: createdBooks[5 + i].id,
      borrowerId: borrowerIds[i % borrowerIds.length],
      issueDate,
      dueDate,
      returnDate: null,
      status: 'ISSUED',
      fine: null,
      remarks: null,
    });
  }

  // 2 Overdue (due date passed, not returned)
  for (let i = 0; i < 2; i++) {
    const issueDate = new Date(today.getTime() - 20 * 24 * 60 * 60 * 1000);
    const dueDate = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    issuesData.push({
      bookId: createdBooks[8 + i].id,
      borrowerId: borrowerIds[i % borrowerIds.length],
      issueDate,
      dueDate,
      returnDate: null,
      status: 'OVERDUE',
      fine: 10,
      remarks: 'Overdue — please return',
    });
  }

  for (const issue of issuesData) {
    const book = await prisma.libraryBook.findUnique({ where: { id: issue.bookId } });
    if (book && (issue.status === 'ISSUED' || issue.status === 'OVERDUE')) {
      await prisma.libraryBook.update({
        where: { id: issue.bookId },
        data: { availableCopies: Math.max(0, book.availableCopies - 1) },
      });
    }
    await prisma.libraryIssue.create({ data: issue });
  }
  console.log(`  Created ${issuesData.length} library issues`);

  // ─── 4. Visitor Logs (5 for today) ────────────────────────────────────────

  console.log('\n--- Seeding Visitor Logs ---');

  await prisma.visitorLog.deleteMany({});

  const visitorData = [
    {
      visitorName: 'Rajesh Kumar',
      phone: '9876543210',
      purpose: 'PARENT_VISIT',
      visitingWhom: 'Class Teacher - Mrs. Sharma',
      department: 'Academics',
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15),
      checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30),
      badgeNumber: 'V-001',
      idProof: 'Aadhaar Card',
      remarks: 'Parent-teacher meeting',
      schoolId: school.id,
      loggedBy: adminUser.id,
    },
    {
      visitorName: 'Suresh Enterprises Rep',
      phone: '9123456789',
      purpose: 'VENDOR',
      visitingWhom: 'Accounts Department',
      department: 'Finance',
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0),
      checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0),
      badgeNumber: 'V-002',
      idProof: 'PAN Card',
      remarks: 'Invoice submission',
      schoolId: school.id,
      loggedBy: adminUser.id,
    },
    {
      visitorName: 'District Education Officer',
      phone: '9988776655',
      purpose: 'OFFICIAL',
      visitingWhom: 'Principal',
      department: 'Administration',
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30),
      checkOut: null, // still inside
      badgeNumber: 'V-003',
      idProof: 'Government ID',
      remarks: 'Annual inspection visit',
      schoolId: school.id,
      loggedBy: adminUser.id,
    },
    {
      visitorName: 'Priya Mehta',
      phone: '9871234567',
      purpose: 'PARENT_VISIT',
      visitingWhom: 'Sports Teacher',
      department: 'Sports',
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0),
      checkOut: null, // still inside
      badgeNumber: 'V-004',
      idProof: 'Driving License',
      remarks: 'Enquiry about sports day',
      schoolId: school.id,
      loggedBy: adminUser.id,
    },
    {
      visitorName: 'Amit Joshi',
      phone: '9765432109',
      purpose: 'INTERVIEW',
      visitingWhom: 'HR Department',
      department: 'Administration',
      checkIn: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0),
      checkOut: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 16, 0),
      badgeNumber: 'V-005',
      idProof: 'Passport',
      remarks: 'Teaching position interview',
      schoolId: school.id,
      loggedBy: adminUser.id,
    },
  ];

  for (const v of visitorData) {
    await prisma.visitorLog.create({ data: v });
  }
  console.log(`  Created ${visitorData.length} visitor logs`);

  console.log('\n=== Seeding Complete ===');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
