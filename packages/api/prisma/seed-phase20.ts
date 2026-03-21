import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding Phase 20: Surveys...');

  const school = await prisma.school.findFirst({ where: { code: 'MIS-IDR' } });
  if (!school) throw new Error('School not found. Run main seed first.');

  const admin = await prisma.user.findFirst({ where: { role: 'SUPER_ADMIN', schoolId: school.id } });
  const adminId = admin?.id ?? 'system';

  // Get some users to use as respondents
  const parents = await prisma.user.findMany({
    where: { schoolId: school.id, role: 'PARENT' },
    take: 5,
  });

  const respondents = parents.length >= 5 ? parents : await prisma.user.findMany({
    where: { schoolId: school.id },
    take: 5,
  });

  // ─── Survey 1: Parent Satisfaction Survey ─────────────────────────
  console.log('Creating Parent Satisfaction Survey...');

  const survey1 = await prisma.survey.create({
    data: {
      title: 'Parent Satisfaction Survey 2025-26',
      description: 'Help us improve by sharing your experience with Medicaps International School. Your feedback is valuable.',
      type: 'PARENT_SATISFACTION',
      status: 'ACTIVE',
      startDate: new Date('2026-03-01'),
      endDate: new Date('2026-03-31'),
      targetAudience: 'PARENTS',
      createdBy: adminId,
      schoolId: school.id,
    },
  });

  const q1 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'How satisfied are you with the overall academic quality of the school?',
      type: 'RATING',
      orderIndex: 1,
      isRequired: true,
    },
  });

  const q2 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'How would you rate the communication between teachers and parents?',
      type: 'RATING',
      orderIndex: 2,
      isRequired: true,
    },
  });

  const q3 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'Which area do you feel needs the most improvement?',
      type: 'MULTIPLE_CHOICE',
      options: ['Academic Teaching', 'Sports & Co-curricular', 'Infrastructure', 'Communication', 'Fee Management'],
      orderIndex: 3,
      isRequired: true,
    },
  });

  const q4 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'Would you recommend this school to other parents?',
      type: 'YES_NO',
      orderIndex: 4,
      isRequired: true,
    },
  });

  const q5 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey1.id,
      text: 'Please share any additional suggestions or comments for the school management.',
      type: 'TEXT',
      orderIndex: 5,
      isRequired: false,
    },
  });

  // Submit 5 responses for survey 1
  const survey1Answers = [
    [
      { questionId: q1.id, answer: 5 },
      { questionId: q2.id, answer: 4 },
      { questionId: q3.id, answer: 'Sports & Co-curricular' },
      { questionId: q4.id, answer: 'YES' },
      { questionId: q5.id, answer: 'Excellent school. Very happy with the academic standards.' },
    ],
    [
      { questionId: q1.id, answer: 4 },
      { questionId: q2.id, answer: 5 },
      { questionId: q3.id, answer: 'Communication' },
      { questionId: q4.id, answer: 'YES' },
      { questionId: q5.id, answer: 'The parent-teacher meetings could be more frequent.' },
    ],
    [
      { questionId: q1.id, answer: 5 },
      { questionId: q2.id, answer: 4 },
      { questionId: q3.id, answer: 'Infrastructure' },
      { questionId: q4.id, answer: 'YES' },
      { questionId: q5.id, answer: 'Better sports facilities would be appreciated.' },
    ],
    [
      { questionId: q1.id, answer: 3 },
      { questionId: q2.id, answer: 3 },
      { questionId: q3.id, answer: 'Academic Teaching' },
      { questionId: q4.id, answer: 'NO' },
      { questionId: q5.id, answer: 'More personalized attention to students who are struggling is needed.' },
    ],
    [
      { questionId: q1.id, answer: 5 },
      { questionId: q2.id, answer: 5 },
      { questionId: q3.id, answer: 'Fee Management' },
      { questionId: q4.id, answer: 'YES' },
      { questionId: q5.id, answer: 'The online fee payment system is very convenient. Keep it up!' },
    ],
  ];

  for (let i = 0; i < Math.min(5, respondents.length); i++) {
    try {
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey1.id,
          respondentId: respondents[i].id,
          answers: survey1Answers[i],
        },
      });
    } catch (e: any) {
      console.warn(`  Skipped response ${i + 1}: ${e.message}`);
    }
  }

  console.log(`  Created survey "${survey1.title}" with 5 questions and ${respondents.length} responses`);

  // ─── Survey 2: Teacher Evaluation Survey ───────────────────────────
  console.log('Creating Teacher Evaluation Survey...');

  const survey2 = await prisma.survey.create({
    data: {
      title: 'Annual Teacher Evaluation 2025-26',
      description: 'Student feedback on teaching quality and classroom effectiveness.',
      type: 'TEACHER_EVALUATION',
      status: 'ACTIVE',
      startDate: new Date('2026-03-15'),
      endDate: new Date('2026-04-15'),
      targetAudience: 'STUDENTS',
      createdBy: adminId,
      schoolId: school.id,
    },
  });

  const tq1 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey2.id,
      text: 'How clearly do your teachers explain concepts in class?',
      type: 'RATING',
      orderIndex: 1,
      isRequired: true,
    },
  });

  const tq2 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey2.id,
      text: 'How available are your teachers for doubt-clearing outside class hours?',
      type: 'RATING',
      orderIndex: 2,
      isRequired: true,
    },
  });

  const tq3 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey2.id,
      text: 'Which teaching method do you find most effective?',
      type: 'MULTIPLE_CHOICE',
      options: ['Lecture-based', 'Interactive Discussion', 'Project-based Learning', 'Digital/Multimedia', 'Practical Demonstrations'],
      orderIndex: 3,
      isRequired: true,
    },
  });

  const tq4 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey2.id,
      text: 'Do teachers provide timely and constructive feedback on assignments?',
      type: 'YES_NO',
      orderIndex: 4,
      isRequired: true,
    },
  });

  const tq5 = await prisma.surveyQuestion.create({
    data: {
      surveyId: survey2.id,
      text: 'What improvements would you suggest for the teaching approach in your school?',
      type: 'TEXT',
      orderIndex: 5,
      isRequired: false,
    },
  });

  // Get students as respondents for survey 2
  const students = await prisma.user.findMany({
    where: { schoolId: school.id, role: 'STUDENT' },
    take: 5,
  });
  const survey2Respondents = students.length >= 5 ? students : respondents;

  const survey2Answers = [
    [
      { questionId: tq1.id, answer: 5 },
      { questionId: tq2.id, answer: 4 },
      { questionId: tq3.id, answer: 'Interactive Discussion' },
      { questionId: tq4.id, answer: 'YES' },
      { questionId: tq5.id, answer: 'More hands-on experiments in science class would be great.' },
    ],
    [
      { questionId: tq1.id, answer: 4 },
      { questionId: tq2.id, answer: 3 },
      { questionId: tq3.id, answer: 'Digital/Multimedia' },
      { questionId: tq4.id, answer: 'YES' },
      { questionId: tq5.id, answer: 'Using more videos and animations helps understand difficult topics.' },
    ],
    [
      { questionId: tq1.id, answer: 3 },
      { questionId: tq2.id, answer: 4 },
      { questionId: tq3.id, answer: 'Project-based Learning' },
      { questionId: tq4.id, answer: 'NO' },
      { questionId: tq5.id, answer: 'Assignment feedback often comes very late. Please improve turnaround time.' },
    ],
    [
      { questionId: tq1.id, answer: 5 },
      { questionId: tq2.id, answer: 5 },
      { questionId: tq3.id, answer: 'Practical Demonstrations' },
      { questionId: tq4.id, answer: 'YES' },
      { questionId: tq5.id, answer: 'Teachers are very supportive. Very happy with the learning environment.' },
    ],
    [
      { questionId: tq1.id, answer: 4 },
      { questionId: tq2.id, answer: 4 },
      { questionId: tq3.id, answer: 'Lecture-based' },
      { questionId: tq4.id, answer: 'YES' },
      { questionId: tq5.id, answer: 'More group activities and class discussions would make learning more engaging.' },
    ],
  ];

  for (let i = 0; i < Math.min(5, survey2Respondents.length); i++) {
    try {
      await prisma.surveyResponse.create({
        data: {
          surveyId: survey2.id,
          respondentId: survey2Respondents[i].id,
          answers: survey2Answers[i],
        },
      });
    } catch (e: any) {
      console.warn(`  Skipped response ${i + 1}: ${e.message}`);
    }
  }

  console.log(`  Created survey "${survey2.title}" with 5 questions and ${survey2Respondents.length} responses`);

  console.log('Phase 20 seed complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
