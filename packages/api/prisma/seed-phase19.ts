import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 19: Staff Directory + Gallery...');

  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';

  // ─── Staff Profiles ─────────────────────────────────────────────
  // Fetch existing profile user IDs + employee IDs to avoid conflicts
  const existingProfiles = await prisma.staffProfile.findMany({
    select: { userId: true, employeeId: true },
  });
  const existingUserIds = new Set(existingProfiles.map(p => p.userId));
  const existingEmpIds = new Set(existingProfiles.map(p => p.employeeId));

  // Get available users (not yet having a staff profile)
  const availableUsers = await prisma.user.findMany({
    where: {
      schoolId: school.id,
      id: { notIn: Array.from(existingUserIds) },
    },
    take: 10,
  });

  const staffData = [
    {
      department: 'ACADEMIC',
      designation: 'Senior Mathematics Teacher',
      dateOfJoining: '2018-06-01',
      qualification: 'M.Sc. Mathematics, B.Ed.',
      specialization: 'Mathematics & Statistics',
      experience: 8,
      emergencyContact: 'Ramesh Sharma',
      emergencyPhone: '9876543201',
      address: '12, Vijay Nagar, Indore, MP 452010',
    },
    {
      department: 'ACADEMIC',
      designation: 'Physics Teacher',
      dateOfJoining: '2020-07-15',
      qualification: 'M.Sc. Physics, B.Ed.',
      specialization: 'Applied Physics & Optics',
      experience: 5,
      emergencyContact: 'Sunita Patel',
      emergencyPhone: '9876543202',
      address: '45, Annapurna Road, Indore, MP 452009',
    },
    {
      department: 'ADMINISTRATION',
      designation: 'Administrative Officer',
      dateOfJoining: '2015-04-01',
      qualification: 'MBA (HR)',
      specialization: 'Human Resources Management',
      experience: 11,
      emergencyContact: 'Deepak Verma',
      emergencyPhone: '9876543203',
      address: '78, Palasia, Indore, MP 452001',
    },
    {
      department: 'IT',
      designation: 'IT Coordinator',
      dateOfJoining: '2021-01-10',
      qualification: 'B.Tech. Computer Science',
      specialization: 'Network Administration, ERP Systems',
      experience: 4,
      emergencyContact: 'Kavita Singh',
      emergencyPhone: '9876543204',
      address: '23, Geeta Bhawan, Indore, MP 452001',
    },
    {
      department: 'SPORTS',
      designation: 'Physical Education Teacher',
      dateOfJoining: '2019-09-01',
      qualification: 'B.P.Ed., M.P.Ed.',
      specialization: 'Athletics & Team Sports',
      experience: 7,
      emergencyContact: 'Manoj Yadav',
      emergencyPhone: '9876543205',
      address: '56, Scheme No 54, Indore, MP 452010',
    },
  ];

  let staffCreated = 0;

  for (let i = 0; i < Math.min(5, availableUsers.length); i++) {
    const user = availableUsers[i];
    const data = staffData[i];

    // Generate unique employee ID
    let empId = `EMP-MIS-${String(i + 101).padStart(3, '0')}`;
    let attempt = 0;
    while (existingEmpIds.has(empId)) {
      attempt++;
      empId = `EMP-MIS-${String(i + 101 + attempt).padStart(3, '0')}`;
    }
    existingEmpIds.add(empId);

    try {
      await prisma.staffProfile.create({
        data: {
          userId: user.id,
          employeeId: empId,
          department: data.department,
          designation: data.designation,
          dateOfJoining: new Date(data.dateOfJoining),
          qualification: data.qualification,
          specialization: data.specialization,
          experience: data.experience,
          emergencyContact: data.emergencyContact,
          emergencyPhone: data.emergencyPhone,
          address: data.address,
        },
      });
      staffCreated++;
      console.log(`  Created profile for user ${user.email} → ${empId}`);
    } catch (e: any) {
      console.warn(`  Skipped user ${user.id}: ${e.message}`);
    }
  }

  if (staffCreated === 0 && availableUsers.length === 0) {
    console.log('No available users for new staff profiles (all users already have profiles).');
  } else {
    console.log(`Created ${staffCreated} staff profiles`);
  }

  // ─── Gallery Albums + Photos ─────────────────────────────────────
  console.log('Creating 3 gallery albums with 5 photos each...');

  const albumSeed = [
    {
      title: 'Annual Sports Day 2026',
      description: 'Highlights from the Annual Sports Day held on 25th March 2026 at the school ground.',
      category: 'SPORTS',
      eventDate: new Date('2026-03-25'),
      isPublished: true,
      photos: [
        { url: 'https://picsum.photos/seed/sd_march1/800/600', caption: 'Opening ceremony march past' },
        { url: 'https://picsum.photos/seed/sd_march2/800/600', caption: '100m sprint finals' },
        { url: 'https://picsum.photos/seed/sd_march3/800/600', caption: 'Relay race in action' },
        { url: 'https://picsum.photos/seed/sd_march4/800/600', caption: 'Prize distribution ceremony' },
        { url: 'https://picsum.photos/seed/sd_march5/800/600', caption: 'Champions with trophies' },
      ],
    },
    {
      title: 'Cultural Fest — Rang Tarang 2026',
      description: 'Annual cultural festival showcasing student talents in dance, music, and drama.',
      category: 'CULTURAL',
      eventDate: new Date('2026-04-20'),
      isPublished: true,
      photos: [
        { url: 'https://picsum.photos/seed/cult1/800/600', caption: 'Classical Bharatnatyam performance' },
        { url: 'https://picsum.photos/seed/cult2/800/600', caption: 'Western music band on stage' },
        { url: 'https://picsum.photos/seed/cult3/800/600', caption: 'Drama — The Lost Kingdom Act II' },
        { url: 'https://picsum.photos/seed/cult4/800/600', caption: 'Group singing competition winners' },
        { url: 'https://picsum.photos/seed/cult5/800/600', caption: 'Audience enjoying the performances' },
      ],
    },
    {
      title: 'Science Exhibition 2026',
      description: 'Students from Class 8–12 showcase innovative science and technology projects.',
      category: 'ACADEMICS',
      eventDate: new Date('2026-05-10'),
      isPublished: false,
      photos: [
        { url: 'https://picsum.photos/seed/sci_ex1/800/600', caption: 'Solar energy model by Class 10' },
        { url: 'https://picsum.photos/seed/sci_ex2/800/600', caption: 'Robotics arm demonstration' },
        { url: 'https://picsum.photos/seed/sci_ex3/800/600', caption: 'Environmental science projects display' },
        { url: 'https://picsum.photos/seed/sci_ex4/800/600', caption: 'Chemistry experiments section' },
        { url: 'https://picsum.photos/seed/sci_ex5/800/600', caption: 'Best project award ceremony' },
      ],
    },
  ];

  for (const albumData of albumSeed) {
    const { photos, ...rest } = albumData;

    const album = await prisma.galleryAlbum.create({
      data: {
        ...rest,
        schoolId: school.id,
        createdBy: adminId,
      },
    });

    for (let i = 0; i < photos.length; i++) {
      await prisma.galleryPhoto.create({
        data: {
          albumId: album.id,
          url: photos[i].url,
          caption: photos[i].caption,
          sortOrder: i,
        },
      });
    }

    console.log(`  Created album "${albumData.title}" with ${photos.length} photos`);
  }

  console.log('Phase 19 seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
