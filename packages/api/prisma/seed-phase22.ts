import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 22: Learning Paths, Rubrics, Live Classes, Badge Awards...');

  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';

  const teacher = await prisma.user.findFirst({ where: { role: 'SUBJECT_TEACHER', schoolId: school.id } });
  const teacherId = teacher?.id ?? adminId;

  const cls = await prisma.class.findFirst({ where: { schoolId: school.id } });
  const classId = cls?.id;

  const subject = await prisma.subject.findFirst({ where: { classId: cls?.id } });
  const subjectId = subject?.id;

  const students = await prisma.student.findMany({ where: { classId: cls?.id ?? '' }, take: 5 });

  // ─── LEARNING PATHS ────────────────────────────────────────────────

  console.log('Creating Learning Paths...');

  // Path 1: Algebra Fundamentals
  const path1 = await prisma.learningPath.create({
    data: {
      title: 'Algebra Fundamentals',
      description: 'Master the basics of algebra step by step, from variables and expressions to solving equations.',
      subjectId: subjectId ?? undefined,
      classId: classId ?? undefined,
      difficulty: 'BEGINNER',
      estimatedHours: 8,
      isPublished: true,
      createdBy: adminId,
      schoolId: school.id,
      steps: {
        create: [
          {
            title: 'Introduction to Variables',
            type: 'VIDEO',
            resourceUrl: 'https://example.com/algebra-vars',
            description: 'Learn what variables are and why they matter',
            orderIndex: 0,
            estimatedMinutes: 20,
          },
          {
            title: 'Writing Algebraic Expressions',
            type: 'READING',
            description: 'Translate word problems into algebraic expressions',
            orderIndex: 1,
            estimatedMinutes: 30,
          },
          {
            title: 'Simplifying Expressions Quiz',
            type: 'QUIZ',
            description: 'Test your understanding of simplifying like terms',
            orderIndex: 2,
            estimatedMinutes: 15,
          },
          {
            title: 'Solving One-Step Equations',
            type: 'VIDEO',
            resourceUrl: 'https://example.com/one-step-eq',
            orderIndex: 3,
            estimatedMinutes: 25,
          },
          {
            title: 'Practice Assignment: Equations',
            type: 'ASSIGNMENT',
            description: '20 practice problems on linear equations',
            orderIndex: 4,
            estimatedMinutes: 45,
          },
          {
            title: 'Final Assessment',
            type: 'QUIZ',
            description: 'Comprehensive quiz covering all algebra basics',
            orderIndex: 5,
            estimatedMinutes: 30,
          },
        ],
      },
    },
  });

  // Path 2: English Essay Writing
  const path2 = await prisma.learningPath.create({
    data: {
      title: 'Essay Writing Mastery',
      description: 'Develop strong writing skills from paragraph structure to full essays with evidence and analysis.',
      classId: classId ?? undefined,
      difficulty: 'MEDIUM',
      estimatedHours: 12,
      isPublished: true,
      createdBy: adminId,
      schoolId: school.id,
      steps: {
        create: [
          {
            title: 'Paragraph Structure Basics',
            type: 'READING',
            description: 'Topic sentence, supporting details, and conclusion',
            orderIndex: 0,
            estimatedMinutes: 20,
          },
          {
            title: 'Types of Essays',
            type: 'VIDEO',
            resourceUrl: 'https://example.com/essay-types',
            orderIndex: 1,
            estimatedMinutes: 30,
          },
          {
            title: 'Research and Evidence',
            type: 'ACTIVITY',
            description: 'Practice finding and citing credible sources',
            orderIndex: 2,
            estimatedMinutes: 40,
          },
          {
            title: 'Writing Your First Draft',
            type: 'ASSIGNMENT',
            description: 'Write a 500-word argumentative essay on a given topic',
            orderIndex: 3,
            estimatedMinutes: 60,
          },
          {
            title: 'Peer Review Exercise',
            type: 'ACTIVITY',
            description: 'Give and receive constructive feedback',
            orderIndex: 4,
            estimatedMinutes: 30,
            isOptional: true,
          },
          {
            title: 'Revision and Final Submission',
            type: 'ASSIGNMENT',
            description: 'Submit polished final essay',
            orderIndex: 5,
            estimatedMinutes: 45,
          },
        ],
      },
    },
  });

  // Path 3: Science Method & Experiments
  const path3 = await prisma.learningPath.create({
    data: {
      title: 'Scientific Method Deep Dive',
      description: 'Advanced exploration of experimental design, data analysis, and scientific reasoning.',
      classId: classId ?? undefined,
      difficulty: 'ADVANCED',
      estimatedHours: 15,
      isPublished: true,
      createdBy: teacherId,
      schoolId: school.id,
      steps: {
        create: [
          {
            title: 'Forming a Hypothesis',
            type: 'VIDEO',
            resourceUrl: 'https://example.com/hypothesis',
            orderIndex: 0,
            estimatedMinutes: 25,
          },
          {
            title: 'Designing a Controlled Experiment',
            type: 'READING',
            orderIndex: 1,
            estimatedMinutes: 35,
          },
          {
            title: 'Data Collection Techniques',
            type: 'VIDEO',
            orderIndex: 2,
            estimatedMinutes: 20,
          },
          {
            title: 'Statistical Analysis Basics',
            type: 'CONTENT',
            description: 'Mean, median, standard deviation, and graphs',
            orderIndex: 3,
            estimatedMinutes: 50,
          },
          {
            title: 'Lab Report Writing',
            type: 'ASSIGNMENT',
            description: 'Write a full lab report for your experiment',
            orderIndex: 4,
            estimatedMinutes: 90,
          },
          {
            title: 'Peer Presentation',
            type: 'ACTIVITY',
            description: 'Present your findings to the class',
            orderIndex: 5,
            estimatedMinutes: 30,
          },
          {
            title: 'Final Assessment',
            type: 'QUIZ',
            description: 'Evaluate understanding of the scientific method',
            orderIndex: 6,
            estimatedMinutes: 40,
          },
        ],
      },
    },
  });

  // Enroll students in paths
  if (students.length > 0) {
    const enrollData = [];
    for (let i = 0; i < Math.min(students.length, 3); i++) {
      enrollData.push(
        prisma.learningPathEnrollment.upsert({
          where: { pathId_studentId: { pathId: path1.id, studentId: students[i].id } },
          update: {},
          create: {
            pathId: path1.id,
            studentId: students[i].id,
            totalSteps: 6,
            currentStep: i,
            completedSteps: i,
            status: i === 0 ? 'ENROLLED' : 'IN_PROGRESS',
            lastAccessedAt: new Date(),
          },
        })
      );
    }
    for (const p of enrollData) await p;
  }

  console.log(`Created 3 learning paths with steps`);

  // ─── RUBRICS ───────────────────────────────────────────────────────

  console.log('Creating Rubrics...');

  // Rubric 1: Essay Writing
  await prisma.rubric.create({
    data: {
      title: 'Essay Writing Rubric',
      description: 'Comprehensive rubric for evaluating student essays',
      type: 'POINTS',
      maxScore: 40,
      createdBy: adminId,
      schoolId: school.id,
      criteria: {
        create: [
          {
            title: 'Content & Ideas',
            description: 'Quality and relevance of ideas presented',
            maxPoints: 10,
            orderIndex: 0,
            levels: {
              create: [
                { title: 'Excellent', description: 'Insightful, well-developed ideas with strong evidence', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Clear ideas with adequate supporting evidence', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Some ideas present but lacking support', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Ideas unclear or missing', points: 1, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Organization & Structure',
            description: 'Logical flow and paragraph structure',
            maxPoints: 10,
            orderIndex: 1,
            levels: {
              create: [
                { title: 'Excellent', description: 'Clear intro, well-organized body, strong conclusion', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Generally well-organized with minor issues', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Some structure but transitions are weak', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Little or no structure evident', points: 1, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Language & Style',
            description: 'Vocabulary, sentence variety, and voice',
            maxPoints: 10,
            orderIndex: 2,
            levels: {
              create: [
                { title: 'Excellent', description: 'Sophisticated vocabulary, varied sentences, strong voice', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Good word choice, some sentence variety', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Simple vocabulary, limited sentence variety', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Very basic language use', points: 1, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Grammar & Mechanics',
            description: 'Spelling, punctuation, and grammar',
            maxPoints: 10,
            orderIndex: 3,
            levels: {
              create: [
                { title: 'Excellent', description: 'Virtually no errors', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Few minor errors that do not impede reading', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Several errors that sometimes impede reading', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Numerous errors that impede reading', points: 1, orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // Rubric 2: Science Lab Report
  await prisma.rubric.create({
    data: {
      title: 'Science Lab Report Rubric',
      description: 'For evaluating student lab report submissions',
      type: 'POINTS',
      maxScore: 50,
      createdBy: teacherId,
      schoolId: school.id,
      criteria: {
        create: [
          {
            title: 'Hypothesis & Background',
            maxPoints: 10,
            orderIndex: 0,
            levels: {
              create: [
                { title: 'Excellent', description: 'Clear hypothesis supported by thorough background research', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Hypothesis present with adequate background', points: 8, orderIndex: 1 },
                { title: 'Fair', description: 'Hypothesis vague or background incomplete', points: 5, orderIndex: 2 },
                { title: 'Poor', description: 'Hypothesis missing or unrelated to background', points: 2, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Materials & Procedure',
            maxPoints: 10,
            orderIndex: 1,
            levels: {
              create: [
                { title: 'Excellent', description: 'Complete, detailed, reproducible procedure', points: 10, orderIndex: 0 },
                { title: 'Good', description: 'Mostly complete with minor omissions', points: 8, orderIndex: 1 },
                { title: 'Fair', description: 'Procedure present but incomplete', points: 5, orderIndex: 2 },
                { title: 'Poor', description: 'Procedure unclear or missing steps', points: 2, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Data Collection & Graphs',
            maxPoints: 15,
            orderIndex: 2,
            levels: {
              create: [
                { title: 'Excellent', description: 'Accurate data, clear tables and labeled graphs', points: 15, orderIndex: 0 },
                { title: 'Good', description: 'Data mostly accurate, graphs present', points: 11, orderIndex: 1 },
                { title: 'Fair', description: 'Data present but poorly organized', points: 7, orderIndex: 2 },
                { title: 'Poor', description: 'Data missing or inaccurate', points: 3, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Analysis & Conclusion',
            maxPoints: 15,
            orderIndex: 3,
            levels: {
              create: [
                { title: 'Excellent', description: 'Thorough analysis linking data to hypothesis', points: 15, orderIndex: 0 },
                { title: 'Good', description: 'Good analysis with minor gaps', points: 11, orderIndex: 1 },
                { title: 'Fair', description: 'Some analysis but conclusion lacks depth', points: 7, orderIndex: 2 },
                { title: 'Poor', description: 'Little or no analysis', points: 3, orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  // Rubric 3: Oral Presentation
  await prisma.rubric.create({
    data: {
      title: 'Oral Presentation Rubric',
      description: 'For evaluating student presentations and speeches',
      type: 'PROFICIENCY',
      maxScore: 30,
      createdBy: adminId,
      schoolId: school.id,
      criteria: {
        create: [
          {
            title: 'Content Knowledge',
            maxPoints: 10,
            orderIndex: 0,
            levels: {
              create: [
                { title: 'Proficient', description: 'Demonstrates thorough understanding of topic', points: 10, orderIndex: 0 },
                { title: 'Approaching', description: 'Shows general understanding with some gaps', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Limited understanding evident', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Does not demonstrate understanding', points: 1, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Delivery & Confidence',
            maxPoints: 10,
            orderIndex: 1,
            levels: {
              create: [
                { title: 'Proficient', description: 'Confident, clear, well-paced delivery', points: 10, orderIndex: 0 },
                { title: 'Approaching', description: 'Generally clear with occasional hesitation', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Nervous, unclear in several areas', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'Very difficult to understand', points: 1, orderIndex: 3 },
              ],
            },
          },
          {
            title: 'Visual Aids & Materials',
            maxPoints: 10,
            orderIndex: 2,
            levels: {
              create: [
                { title: 'Proficient', description: 'Professional, clear visuals that enhance presentation', points: 10, orderIndex: 0 },
                { title: 'Approaching', description: 'Adequate visuals with minor issues', points: 7, orderIndex: 1 },
                { title: 'Developing', description: 'Visuals present but add little value', points: 4, orderIndex: 2 },
                { title: 'Beginning', description: 'No visuals or distracting materials', points: 1, orderIndex: 3 },
              ],
            },
          },
        ],
      },
    },
  });

  console.log('Created 3 rubrics with criteria and levels');

  // ─── LIVE CLASSES ──────────────────────────────────────────────────

  console.log('Creating Live Classes...');

  const now = new Date();

  // 2 Upcoming
  await prisma.liveClass.create({
    data: {
      title: 'Algebra Chapter 6: Quadratic Equations',
      description: 'Interactive live session covering quadratic equations, factoring, and the quadratic formula.',
      classId: classId!,
      subjectId: subjectId ?? undefined,
      teacherId: teacherId,
      scheduledAt: new Date(now.getTime() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
      duration: 60,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'SCHEDULED',
      maxParticipants: 40,
      notes: 'Please complete Chapter 5 exercises before joining.',
      schoolId: school.id,
    },
  });

  await prisma.liveClass.create({
    data: {
      title: 'English Literature: Poetry Analysis',
      description: 'Deep dive into poetic devices, tone, and theme analysis using selected poems.',
      classId: classId!,
      teacherId: adminId,
      scheduledAt: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
      duration: 45,
      meetingUrl: 'https://zoom.us/j/123456789',
      status: 'SCHEDULED',
      maxParticipants: 35,
      schoolId: school.id,
    },
  });

  // 2 Completed
  await prisma.liveClass.create({
    data: {
      title: 'Introduction to Photosynthesis',
      description: 'Live lab demonstration and Q&A session on the process of photosynthesis.',
      classId: classId!,
      subjectId: subjectId ?? undefined,
      teacherId: teacherId,
      scheduledAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      duration: 50,
      meetingUrl: 'https://meet.google.com/xyz-uvwx-yz',
      recordingUrl: 'https://drive.google.com/recordings/photosynthesis-class',
      status: 'COMPLETED',
      attendeeCount: 28,
      schoolId: school.id,
    },
  });

  await prisma.liveClass.create({
    data: {
      title: 'History: World War II Overview',
      description: 'Comprehensive overview of the causes, events, and aftermath of World War II.',
      classId: classId!,
      teacherId: adminId,
      scheduledAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
      duration: 75,
      recordingUrl: 'https://drive.google.com/recordings/ww2-overview',
      status: 'COMPLETED',
      attendeeCount: 32,
      schoolId: school.id,
    },
  });

  // 1 Cancelled
  await prisma.liveClass.create({
    data: {
      title: 'Chemistry: Periodic Table Review',
      description: 'Scheduled review session for upcoming chemistry exam.',
      classId: classId!,
      teacherId: teacherId,
      scheduledAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      duration: 60,
      status: 'CANCELLED',
      notes: 'Class cancelled due to teacher illness. Will be rescheduled.',
      schoolId: school.id,
    },
  });

  console.log('Created 5 live classes (2 upcoming, 2 completed, 1 cancelled)');

  // ─── BADGE AWARDS (Gamification) ────────────────────────────────────

  console.log('Creating Badge Awards for gamification...');

  // Find badges
  const badges = await prisma.badge.findMany({ where: { schoolId: school.id }, take: 10 });

  if (badges.length > 0 && students.length > 0) {
    let awarded = 0;
    for (const student of students) {
      for (const badge of badges) {
        if (awarded >= 20) break;
        try {
          await prisma.badgeAward.upsert({
            where: { badgeId_studentId: { badgeId: badge.id, studentId: student.id } },
            update: {},
            create: {
              badgeId: badge.id,
              studentId: student.id,
              awardedBy: adminId,
              reason: `Awarded for exceptional performance - ${badge.category}`,
              awardedAt: new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000),
            },
          });
          awarded++;
        } catch {
          // Skip duplicates
        }
      }
      if (awarded >= 20) break;
    }
    console.log(`Created ${awarded} badge awards`);
  } else {
    console.log('No badges or students found, skipping badge awards');
  }

  console.log('Phase 22 seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
