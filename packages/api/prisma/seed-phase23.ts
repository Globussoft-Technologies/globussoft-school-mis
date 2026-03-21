import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 23: Course Modules, Discussions, Gamification...');

  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';

  // Get Class 10 for leaderboard
  const class10 = await prisma.class.findFirst({ where: { schoolId: school.id, name: 'Class 10' } });
  if (!class10) throw new Error('Class 10 not found.');

  // Get a subject for Class 10
  const subjects = await prisma.subject.findMany({ where: { classId: class10.id } });
  const subjectId = subjects[0]?.id;
  if (!subjectId) throw new Error('No subjects found for Class 10.');

  // Get students for seeding
  const students = await prisma.student.findMany({
    where: { classId: class10.id },
    take: 10,
  });
  const studentIds = students.map((s) => s.id);

  // ─── 1. Course Modules ────────────────────────────────────────────────────

  console.log('Creating course modules...');

  const moduleData = [
    {
      title: 'Introduction to Mathematics',
      description: 'Foundation concepts: numbers, operations, and basic algebra.',
      unlockType: 'ALWAYS',
      completionCriteria: 'VIEW_ALL',
      estimatedMinutes: 60,
      items: [
        { title: 'Welcome Video', type: 'VIDEO', estimatedMinutes: 10, contentUrl: 'https://example.com/intro-math' },
        { title: 'Number Systems Overview', type: 'CONTENT', estimatedMinutes: 15 },
        { title: 'Basic Operations Worksheet', type: 'DOCUMENT', estimatedMinutes: 20 },
        { title: 'Check Your Understanding Quiz', type: 'QUIZ', estimatedMinutes: 15 },
      ],
    },
    {
      title: 'Algebra Fundamentals',
      description: 'Variables, expressions, equations, and inequalities.',
      unlockType: 'SEQUENTIAL',
      completionCriteria: 'VIEW_ALL',
      estimatedMinutes: 90,
      items: [
        { title: 'Introduction to Variables', type: 'VIDEO', estimatedMinutes: 12 },
        { title: 'Algebraic Expressions', type: 'PAGE', estimatedMinutes: 20 },
        { title: 'Solving Linear Equations', type: 'CONTENT', estimatedMinutes: 25 },
        { title: 'Practice Problems Set 1', type: 'ASSIGNMENT', estimatedMinutes: 30, isRequired: false },
        { title: 'Module Assessment', type: 'QUIZ', estimatedMinutes: 20 },
      ],
    },
    {
      title: 'Geometry Basics',
      description: 'Points, lines, angles, triangles, and circles.',
      unlockType: 'SEQUENTIAL',
      completionCriteria: 'SCORE_MINIMUM',
      minimumScore: 60,
      estimatedMinutes: 120,
      items: [
        { title: 'Geometry in Everyday Life', type: 'VIDEO', estimatedMinutes: 8 },
        { title: 'Types of Angles', type: 'CONTENT', estimatedMinutes: 15 },
        { title: 'Triangle Properties', type: 'PAGE', estimatedMinutes: 20 },
        { title: 'Circle Theorems', type: 'DOCUMENT', estimatedMinutes: 25, contentUrl: 'https://example.com/circles.pdf' },
        { title: 'Geometry Practice Test', type: 'QUIZ', estimatedMinutes: 30 },
      ],
    },
    {
      title: 'Statistics & Probability',
      description: 'Data collection, analysis, mean, median, mode, and basic probability.',
      unlockType: 'DATE',
      unlockDate: new Date('2026-04-15'),
      completionCriteria: 'VIEW_ALL',
      estimatedMinutes: 80,
      items: [
        { title: 'Introduction to Statistics', type: 'VIDEO', estimatedMinutes: 10 },
        { title: 'Measures of Central Tendency', type: 'CONTENT', estimatedMinutes: 20 },
        { title: 'Data Visualization', type: 'LINK', estimatedMinutes: 15, contentUrl: 'https://charts.example.com' },
        { title: 'Probability Concepts', type: 'PAGE', estimatedMinutes: 20 },
        { title: 'Statistics Assignment', type: 'ASSIGNMENT', estimatedMinutes: 40 },
      ],
    },
    {
      title: 'Advanced Problem Solving',
      description: 'Challenging problems combining all previous topics.',
      unlockType: 'PREREQUISITE',
      completionCriteria: 'SCORE_MINIMUM',
      minimumScore: 70,
      estimatedMinutes: 150,
      items: [
        { title: 'Problem Solving Strategies', type: 'VIDEO', estimatedMinutes: 15 },
        { title: 'Mixed Topic Practice', type: 'ASSIGNMENT', estimatedMinutes: 45 },
        { title: 'Past Exam Questions', type: 'DOCUMENT', estimatedMinutes: 40 },
        { title: 'Final Challenge Quiz', type: 'QUIZ', estimatedMinutes: 45 },
      ],
    },
  ];

  const createdModules: any[] = [];
  for (let i = 0; i < moduleData.length; i++) {
    const md = moduleData[i];
    const module = await prisma.courseModule.create({
      data: {
        title: md.title,
        description: md.description,
        classId: class10.id,
        subjectId,
        orderIndex: i + 1,
        isPublished: true,
        unlockType: md.unlockType,
        unlockDate: (md as any).unlockDate,
        prerequisiteModuleId: i === 4 ? createdModules[2]?.id : undefined,
        completionCriteria: md.completionCriteria,
        minimumScore: (md as any).minimumScore,
        estimatedMinutes: md.estimatedMinutes,
        createdBy: adminId,
        items: {
          create: md.items.map((item: any, j) => ({
            title: item.title,
            type: item.type,
            contentUrl: item.contentUrl,
            orderIndex: j + 1,
            isRequired: item.isRequired !== false,
            estimatedMinutes: item.estimatedMinutes,
          })),
        },
      },
    });
    createdModules.push(module);
    console.log(`  Created module: ${module.title}`);
  }

  // Seed some completions for first student
  if (studentIds.length > 0) {
    const firstModule = await prisma.courseModule.findFirst({
      where: { classId: class10.id, subjectId, orderIndex: 1 },
      include: { items: true },
    });
    if (firstModule) {
      for (const item of firstModule.items.slice(0, 3)) {
        await prisma.moduleItemCompletion.upsert({
          where: { itemId_studentId: { itemId: item.id, studentId: studentIds[0] } },
          create: { itemId: item.id, studentId: studentIds[0], status: 'COMPLETED', completedAt: new Date() },
          update: { status: 'COMPLETED', completedAt: new Date() },
        });
      }
    }
  }

  // ─── 2. Discussion Forums ─────────────────────────────────────────────────

  console.log('Creating discussion forums...');

  const forum1 = await prisma.discussionForum.create({
    data: {
      title: 'Mathematics Problem Solving Forum',
      description: 'Share your approaches to difficult math problems, ask questions, and help classmates.',
      classId: class10.id,
      subjectId,
      type: 'OPEN',
      isLocked: false,
      isPinned: true,
      allowAnonymous: false,
      createdBy: adminId,
    },
  });

  // Posts for forum 1
  const post1 = await prisma.discussionPost.create({
    data: {
      forumId: forum1.id,
      authorId: adminId,
      content: 'Welcome to the Mathematics Problem Solving Forum! This is a space to collaborate on challenging problems. Feel free to share solutions, ask questions, and help each other.\n\nTip: When sharing a solution, explain your reasoning step by step!',
      isPinned: true,
    },
  });

  const post2 = await prisma.discussionPost.create({
    data: {
      forumId: forum1.id,
      authorId: studentIds[0] ?? adminId,
      content: "I'm stuck on the problem about quadratic equations. Can someone explain how to use the discriminant to determine the nature of roots?",
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum1.id,
      authorId: studentIds[1] ?? adminId,
      parentId: post2.id,
      content: 'Great question! The discriminant (b² - 4ac) tells you:\n• If D > 0: two distinct real roots\n• If D = 0: one repeated real root\n• If D < 0: no real roots (complex roots)\n\nFor example, in x² - 5x + 6 = 0, D = 25 - 24 = 1 > 0, so there are two distinct roots.',
      likes: 5,
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum1.id,
      authorId: studentIds[2] ?? adminId,
      parentId: post2.id,
      content: 'Adding to what was said above — once you know D > 0, you can use the quadratic formula: x = (-b ± √D) / 2a to find the actual values!',
      likes: 3,
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum1.id,
      authorId: studentIds[3] ?? adminId,
      content: 'Can someone help me understand how to find the area of a triangle using Heron\'s formula? I keep getting confused with the semi-perimeter.',
      likes: 1,
    },
  });

  const forum2 = await prisma.discussionForum.create({
    data: {
      title: 'Chapter 5: Statistics Discussion — Graded',
      description: 'Discuss real-world applications of statistics. This is a graded discussion worth 10 points.',
      classId: class10.id,
      subjectId,
      type: 'GRADED',
      totalPoints: 10,
      dueDate: new Date('2026-04-30'),
      isLocked: false,
      createdBy: adminId,
    },
  });

  const gradedPost1 = await prisma.discussionPost.create({
    data: {
      forumId: forum2.id,
      authorId: studentIds[0] ?? adminId,
      content: 'Statistics is used everywhere in daily life! For example, cricket selectors use batting averages (mean) to pick players for the national team. They also look at standard deviation to understand consistency.',
      score: 8,
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum2.id,
      authorId: studentIds[1] ?? adminId,
      content: 'I found that weather forecasting uses probability extensively. The "30% chance of rain" you see on weather apps is calculated using historical data and probability distributions.',
      score: 9,
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum2.id,
      authorId: studentIds[0] ?? adminId,
      parentId: gradedPost1.id,
      content: 'Great example! I\'d also add that opinion polls before elections use sampling techniques — they survey a small group but can predict outcomes for millions of voters.',
    },
  });

  const forum3 = await prisma.discussionForum.create({
    data: {
      title: 'Q&A: Exam Preparation Doubts',
      description: 'Post your exam-related doubts here. Teachers will answer within 24 hours.',
      classId: class10.id,
      type: 'Q_AND_A',
      isLocked: false,
      createdBy: adminId,
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum3.id,
      authorId: studentIds[2] ?? adminId,
      content: 'Will there be questions on trigonometric identities in the board exam? Should I memorize all of them?',
    },
  });

  await prisma.discussionPost.create({
    data: {
      forumId: forum3.id,
      authorId: adminId,
      content: 'Yes, trigonometric identities are part of the syllabus. You should know the fundamental identities (sin²θ + cos²θ = 1, etc.) and be able to prove basic ones. You don\'t need to memorize derived identities — focus on understanding how to derive them.',
      likes: 8,
    },
  });

  console.log(`  Created forums: ${forum1.title}, ${forum2.title}, ${forum3.title}`);

  // ─── 3. Gamification ─────────────────────────────────────────────────────

  console.log('Creating badges...');

  const badgeTemplates = [
    { name: 'Perfect Attendance', description: 'Attended all classes for a full month', category: 'ATTENDANCE', criteria: 'Zero absences for 30 consecutive school days', pointsValue: 50 },
    { name: 'Math Wizard', description: 'Scored 95% or above in Mathematics', category: 'ACADEMIC', criteria: 'Achieve 95%+ in any Mathematics assessment', pointsValue: 75 },
    { name: 'Bookworm', description: 'Borrowed 10 or more books from the library', category: 'ACADEMIC', criteria: 'Borrow and return 10 library books in a semester', pointsValue: 30 },
    { name: 'Discussion Champion', description: 'Most active participant in online forums', category: 'PARTICIPATION', criteria: 'Post 20+ quality contributions in discussion forums', pointsValue: 40 },
    { name: 'Assignment Pro', description: 'Submitted all assignments on time for a term', category: 'ACADEMIC', criteria: 'Zero late submissions for an entire term', pointsValue: 60 },
    { name: 'Team Player', description: 'Outstanding contribution to group projects', category: 'PARTICIPATION', criteria: 'Nominated by teacher for exceptional group work', pointsValue: 35 },
    { name: 'Sports Star', description: 'Won a medal in inter-school sports competition', category: 'SPORTS', criteria: 'Win 1st, 2nd, or 3rd place in any inter-school event', pointsValue: 100 },
    { name: 'Conduct Excellence', description: 'Zero disciplinary incidents for the full year', category: 'CONDUCT', criteria: 'No disciplinary records for an entire academic year', pointsValue: 80 },
    { name: 'First Steps', description: 'Completed your first course module', category: 'ACADEMIC', criteria: 'Complete any one course module', pointsValue: 15 },
    { name: 'Knowledge Seeker', description: 'Completed 5 course modules', category: 'ACADEMIC', criteria: 'Complete 5 course modules', pointsValue: 50 },
  ];

  const createdBadges: any[] = [];
  for (const bt of badgeTemplates) {
    const badge = await prisma.badge.create({
      data: { ...bt, schoolId: school.id },
    });
    createdBadges.push(badge);
  }
  console.log(`  Created ${createdBadges.length} badges`);

  // ─── Award points to students ─────────────────────────────────────────────

  console.log('Awarding points to students...');

  const pointAwards = [
    { studentIndex: 0, points: 85, category: 'ACADEMIC', reason: 'Excellent performance in Unit Test 1' },
    { studentIndex: 0, points: 20, category: 'PARTICIPATION', reason: 'Active discussion forum participation' },
    { studentIndex: 0, points: 10, category: 'HOMEWORK', reason: 'Submitted all homework on time - Week 1' },
    { studentIndex: 1, points: 95, category: 'ACADEMIC', reason: 'Top scorer in Mathematics Mid-term' },
    { studentIndex: 1, points: 30, category: 'PARTICIPATION', reason: 'Led study group effectively' },
    { studentIndex: 1, points: 15, category: 'QUIZ', reason: 'Perfect score in algebra quiz' },
    { studentIndex: 2, points: 70, category: 'ACADEMIC', reason: 'Consistent performance in assessments' },
    { studentIndex: 2, points: 50, category: 'ATTENDANCE', reason: 'Perfect attendance for October' },
    { studentIndex: 2, points: 10, category: 'HOMEWORK', reason: 'Submitted homework on time - Week 2' },
    { studentIndex: 3, points: 60, category: 'ACADEMIC', reason: 'Improved performance - 30% increase' },
    { studentIndex: 3, points: 25, category: 'PARTICIPATION', reason: 'Excellent class participation' },
    { studentIndex: 4, points: 110, category: 'ACADEMIC', reason: 'Outstanding performance in term exams' },
    { studentIndex: 4, points: 40, category: 'EXTRA_CREDIT', reason: 'Completed optional research project' },
    { studentIndex: 5, points: 45, category: 'ACADEMIC', reason: 'Good performance in science practical' },
    { studentIndex: 5, points: 20, category: 'ATTENDANCE', reason: 'No absences in November' },
    { studentIndex: 6, points: 80, category: 'ACADEMIC', reason: 'Scored 90% in English essay' },
    { studentIndex: 6, points: 15, category: 'HOMEWORK', reason: 'Submitted all assignments on time' },
    { studentIndex: 7, points: 35, category: 'PARTICIPATION', reason: 'Organized study sessions for classmates' },
    { studentIndex: 8, points: 55, category: 'ACADEMIC', reason: 'Completed extra reading modules' },
    { studentIndex: 9, points: 75, category: 'ACADEMIC', reason: 'Best performance in drawing competition' },
  ];

  for (const award of pointAwards) {
    const studentId = studentIds[award.studentIndex];
    if (!studentId) continue;
    await prisma.studentPoints.create({
      data: {
        studentId,
        points: award.points,
        level: Math.floor(award.points / 100) + 1,
        category: award.category,
        reason: award.reason,
        awardedBy: adminId,
      },
    });
  }
  console.log(`  Awarded ${pointAwards.length} point records`);

  // ─── Award badges to students ─────────────────────────────────────────────

  console.log('Awarding badges to students...');

  const badgeAwardData = [
    { studentIndex: 0, badgeIndex: 8, reason: 'Completed Introduction to Mathematics module' },
    { studentIndex: 0, badgeIndex: 3, reason: 'Top contributor in Math Forum with 25 quality posts' },
    { studentIndex: 1, badgeIndex: 1, reason: 'Scored 97% in Term 1 Mathematics exam' },
    { studentIndex: 1, badgeIndex: 8, reason: 'First student to complete all module items' },
    { studentIndex: 1, badgeIndex: 4, reason: 'Perfect assignment submission record for Term 1' },
    { studentIndex: 2, badgeIndex: 0, reason: 'Zero absences for October and November combined' },
    { studentIndex: 2, badgeIndex: 5, reason: 'Exceptional contribution to the science group project' },
    { studentIndex: 3, badgeIndex: 8, reason: 'Completed Introduction module with perfect score' },
    { studentIndex: 4, badgeIndex: 1, reason: 'Scored 96% in Mathematics — top of class' },
    { studentIndex: 4, badgeIndex: 9, reason: 'Completed 5 course modules in record time' },
    { studentIndex: 4, badgeIndex: 7, reason: 'Exemplary conduct throughout the academic year' },
    { studentIndex: 5, badgeIndex: 2, reason: 'Borrowed and returned 12 books this semester' },
    { studentIndex: 6, badgeIndex: 3, reason: 'Active participation in all discussion forums' },
    { studentIndex: 7, badgeIndex: 5, reason: 'Outstanding team collaboration in group assignments' },
    { studentIndex: 8, badgeIndex: 8, reason: 'Completed first course module' },
  ];

  for (const ba of badgeAwardData) {
    const studentId = studentIds[ba.studentIndex];
    const badge = createdBadges[ba.badgeIndex];
    if (!studentId || !badge) continue;
    try {
      await prisma.badgeAward.create({
        data: { badgeId: badge.id, studentId, awardedBy: adminId, reason: ba.reason },
      });
    } catch {
      // Skip duplicate badge awards
    }
  }
  console.log(`  Awarded ${badgeAwardData.length} badges`);

  // ─── Create leaderboard entries for Class 10 ──────────────────────────────

  console.log('Creating leaderboard for Class 10...');

  for (const studentId of studentIds) {
    const agg = await prisma.studentPoints.aggregate({
      where: { studentId },
      _sum: { points: true },
    });
    const totalPoints = agg._sum.points ?? 0;
    const badgeCount = await prisma.badgeAward.count({ where: { studentId } });
    const level = Math.floor(totalPoints / 100) + 1;

    await prisma.leaderboard.upsert({
      where: { studentId_classId: { studentId, classId: class10.id } },
      create: { studentId, classId: class10.id, totalPoints, level, badgeCount },
      update: { totalPoints, level, badgeCount },
    });
  }

  // Compute and save rankings
  const leaderboardEntries = await prisma.leaderboard.findMany({
    where: { classId: class10.id },
    orderBy: { totalPoints: 'desc' },
  });

  for (let i = 0; i < leaderboardEntries.length; i++) {
    await prisma.leaderboard.update({
      where: { id: leaderboardEntries[i].id },
      data: { rank: i + 1 },
    });
  }

  console.log(`  Created leaderboard with ${leaderboardEntries.length} entries for Class 10`);
  console.log('Seeding Phase 23 complete!');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
