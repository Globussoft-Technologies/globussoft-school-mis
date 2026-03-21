import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding phase 18 data (expenses + budgets + alumni)...');

  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const accountant = await prisma.user.findFirst({ where: { role: 'ACCOUNTANT', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';
  const accountantId = accountant?.id ?? adminId;

  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;

  // ─── 3 Budgets ────────────────────────────────────────────────────
  const budgetData = [
    { category: 'SALARY', amount: 500000, month, year, schoolId: school.id },
    { category: 'MAINTENANCE', amount: 50000, month, year, schoolId: school.id },
    { category: 'UTILITIES', amount: 30000, month, year, schoolId: school.id },
    { category: 'SUPPLIES', amount: 20000, month, year, schoolId: school.id },
    { category: 'TRANSPORT', amount: 25000, month, year, schoolId: school.id },
    { category: 'EVENTS', amount: 80000, month, year, schoolId: school.id },
    { category: 'INFRASTRUCTURE', amount: 100000, month, year, schoolId: school.id },
    { category: 'OTHER', amount: 15000, month, year, schoolId: school.id },
  ];

  for (const b of budgetData.slice(0, 3)) {
    await prisma.budget.upsert({
      where: {
        category_month_year_schoolId: {
          category: b.category,
          month: b.month,
          year: b.year,
          schoolId: b.schoolId,
        },
      },
      update: { amount: b.amount },
      create: b,
    });
  }
  console.log('Created 3 budgets');

  // ─── 10 Expenses ─────────────────────────────────────────────────
  const expensesData = [
    {
      title: 'Staff Salaries - March 2026',
      category: 'SALARY',
      amount: 485000,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-01`),
      vendor: 'Payroll Account',
      invoiceNo: 'SAL-2026-03',
      description: 'Monthly salary disbursement for all teaching and non-teaching staff',
      status: 'PAID',
      approvedBy: adminId,
      paidBy: accountantId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Electricity Bill - February 2026',
      category: 'UTILITIES',
      amount: 28500,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-05`),
      vendor: 'MP Electricity Board',
      invoiceNo: 'EB-FEB-2026',
      description: 'Monthly electricity charges for the school campus',
      status: 'PAID',
      approvedBy: adminId,
      paidBy: accountantId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Annual Sports Day - Arrangements',
      category: 'EVENTS',
      amount: 48500,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-10`),
      vendor: 'Event Supplies Co.',
      invoiceNo: 'EVT-2026-001',
      description: 'Trophies, banners, refreshments, and decoration for Annual Sports Day',
      status: 'APPROVED',
      approvedBy: adminId,
      schoolId: school.id,
      createdBy: adminId,
    },
    {
      title: 'Lab Equipment Procurement',
      category: 'SUPPLIES',
      amount: 18750,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-12`),
      vendor: 'Scientific Suppliers India',
      invoiceNo: 'LAB-2026-042',
      description: 'Science lab equipment: microscopes, chemicals, glassware for Class 11-12',
      status: 'APPROVED',
      approvedBy: adminId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Classroom AC Repair',
      category: 'MAINTENANCE',
      amount: 12000,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-14`),
      vendor: 'Cool Air Services',
      invoiceNo: 'MAINT-2026-018',
      description: 'Repair and servicing of 6 classroom air conditioning units',
      status: 'PENDING',
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'School Bus Fuel - March 2026',
      category: 'TRANSPORT',
      amount: 22400,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-15`),
      vendor: 'Indian Oil Corporation',
      invoiceNo: 'FUEL-MAR-2026',
      description: 'Diesel for 4 school buses for the month of March',
      status: 'PAID',
      approvedBy: adminId,
      paidBy: accountantId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Computer Lab Upgrade',
      category: 'INFRASTRUCTURE',
      amount: 95000,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-16`),
      vendor: 'TechWorld Solutions',
      invoiceNo: 'INFRA-2026-005',
      description: 'Purchase of 10 new desktop computers for the secondary computer lab',
      status: 'PENDING',
      schoolId: school.id,
      createdBy: adminId,
    },
    {
      title: 'Drinking Water RO Maintenance',
      category: 'UTILITIES',
      amount: 4500,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-18`),
      vendor: 'PureWater Systems',
      invoiceNo: 'RO-2026-012',
      description: 'AMC charge for RO water purification system quarterly service',
      status: 'APPROVED',
      approvedBy: adminId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Stationery and Office Supplies',
      category: 'SUPPLIES',
      amount: 7200,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-19`),
      vendor: 'Office Depot India',
      invoiceNo: 'STAT-2026-031',
      description: 'Monthly stationery replenishment: paper, pens, registers, files',
      status: 'PAID',
      approvedBy: adminId,
      paidBy: accountantId,
      schoolId: school.id,
      createdBy: accountantId,
    },
    {
      title: 'Website Development & Hosting',
      category: 'OTHER',
      amount: 15000,
      date: new Date(`${year}-${String(month).padStart(2, '0')}-20`),
      vendor: 'WebCraft Agency',
      invoiceNo: 'WEB-2026-001',
      description: 'Annual website redesign and hosting renewal for school website',
      status: 'REJECTED',
      approvedBy: adminId,
      schoolId: school.id,
      createdBy: adminId,
    },
  ];

  for (const expense of expensesData) {
    await prisma.expense.create({ data: expense });
  }
  console.log('Created 10 expenses');

  // ─── 10 Alumni Records ────────────────────────────────────────────
  const alumniData = [
    {
      name: 'Arjun Sharma',
      email: 'arjun.sharma@gmail.com',
      phone: '9876543210',
      graduationYear: 2015,
      lastClass: 'Class 12 - Science',
      currentStatus: 'HIGHER_EDUCATION',
      organization: 'IIT Bombay',
      designation: 'PhD Scholar',
      city: 'Mumbai',
      linkedinUrl: 'https://linkedin.com/in/arjunsharma',
      achievements: 'Secured AIR 245 in JEE Advanced 2015. Awarded Best Research Scholar 2022 at IIT Bombay.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Priya Patel',
      email: 'priya.patel@hotmail.com',
      phone: '9812345678',
      graduationYear: 2018,
      lastClass: 'Class 12 - Commerce',
      currentStatus: 'EMPLOYED',
      organization: 'HDFC Bank',
      designation: 'Senior Financial Analyst',
      city: 'Indore',
      achievements: 'CA Final cleared in first attempt. Promoted to Senior Analyst within 2 years.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Rahul Gupta',
      email: 'rahulgupta@startup.in',
      phone: '9988776655',
      graduationYear: 2012,
      lastClass: 'Class 12 - Science',
      currentStatus: 'ENTREPRENEUR',
      organization: 'TechNova Solutions',
      designation: 'Co-Founder & CEO',
      city: 'Pune',
      linkedinUrl: 'https://linkedin.com/in/rahulgupta',
      achievements: 'Founded EdTech startup valued at ₹5 crore. Featured in Forbes 30 Under 30 India 2021.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Sneha Joshi',
      email: 'sneha.joshi@gmail.com',
      phone: '9871234560',
      graduationYear: 2020,
      lastClass: 'Class 12 - Science',
      currentStatus: 'HIGHER_EDUCATION',
      organization: 'AIIMS New Delhi',
      designation: 'MBBS Student',
      city: 'New Delhi',
      achievements: 'Scored 98.5 percentile in NEET 2020. School topper in Biology.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Amit Verma',
      email: 'amitverma@infosys.com',
      phone: '9765432109',
      graduationYear: 2016,
      lastClass: 'Class 12 - Science',
      currentStatus: 'EMPLOYED',
      organization: 'Infosys',
      designation: 'Software Engineer Lead',
      city: 'Bengaluru',
      linkedinUrl: 'https://linkedin.com/in/amitverma',
      achievements: 'Led migration of legacy systems saving company ₹2Cr annually. AWS Certified Solutions Architect.',
      isVerified: false,
      schoolId: school.id,
    },
    {
      name: 'Kavita Singh',
      email: 'kavitasingh@teacher.edu',
      phone: '9856781234',
      graduationYear: 2010,
      lastClass: 'Class 12 - Arts',
      currentStatus: 'EMPLOYED',
      organization: 'Kendriya Vidyalaya No. 1',
      designation: 'History & Civics Teacher',
      city: 'Bhopal',
      achievements: 'Best Teacher Award - Madhya Pradesh 2020. Published two books on Indian History.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Vikram Malhotra',
      email: 'vikram.malhotra@gmail.com',
      phone: '9900112233',
      graduationYear: 2008,
      lastClass: 'Class 12 - Commerce',
      currentStatus: 'ENTREPRENEUR',
      organization: 'Malhotra & Associates',
      designation: 'Managing Partner',
      city: 'Indore',
      linkedinUrl: 'https://linkedin.com/in/vikrammalhotra',
      achievements: 'Established leading CA firm in Indore. Mentor for 50+ startup founders.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Ananya Reddy',
      email: 'ananya.reddy@ias.gov.in',
      phone: '9012345678',
      graduationYear: 2013,
      lastClass: 'Class 12 - Arts',
      currentStatus: 'EMPLOYED',
      organization: 'Government of Madhya Pradesh',
      designation: 'IAS Officer - SDM',
      city: 'Jabalpur',
      achievements: 'Cleared UPSC Civil Services Examination 2018. AIR 87. School prefect and debate champion.',
      isVerified: true,
      schoolId: school.id,
    },
    {
      name: 'Rohan Tiwari',
      email: 'rohantiwari@nift.ac.in',
      phone: '9543219876',
      graduationYear: 2019,
      lastClass: 'Class 12 - Arts',
      currentStatus: 'HIGHER_EDUCATION',
      organization: 'NIFT Delhi',
      designation: 'Fashion Design Student',
      city: 'New Delhi',
      achievements: 'Won National Level Fashion Design Competition 2022. School annual day best performer.',
      isVerified: false,
      schoolId: school.id,
    },
    {
      name: 'Deepa Nair',
      email: 'deepanair@google.com',
      phone: '9234567890',
      graduationYear: 2014,
      lastClass: 'Class 12 - Science',
      currentStatus: 'EMPLOYED',
      organization: 'Google India',
      designation: 'Senior Product Manager',
      city: 'Hyderabad',
      linkedinUrl: 'https://linkedin.com/in/deepanair',
      achievements: 'Led Google Pay India product team. Speaker at Google I/O 2023. IIM Bangalore MBA Gold Medalist.',
      isVerified: true,
      schoolId: school.id,
    },
  ];

  for (const alumnus of alumniData) {
    await prisma.alumni.create({ data: alumnus });
  }
  console.log('Created 10 alumni records');

  console.log('Phase 18 seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
