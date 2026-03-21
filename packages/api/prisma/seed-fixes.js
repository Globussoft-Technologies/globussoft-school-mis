const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const school = await p.school.findFirst();
  const session = await p.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!school || !session) { console.log('No school/session'); return; }

  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  if (!teacher) { console.log('No teacher'); return; }

  // ─── 1. Seed attendance for TODAY ───────────────────────────
  console.log('--- Seeding attendance for today ---');
  const today = new Date(new Date().toISOString().split('T')[0]);
  const classes9_10 = await p.class.findMany({
    where: { grade: { in: [9, 10] }, schoolId: school.id },
    include: { sections: true },
  });

  let attCount = 0;
  for (const cls of classes9_10) {
    for (const section of cls.sections) {
      const students = await p.student.findMany({
        where: { classId: cls.id, sectionId: section.id, isActive: true },
      });
      for (const [i, student] of students.entries()) {
        const rand = Math.random();
        const status = rand < 0.8 ? 'PRESENT' : rand < 0.9 ? 'ABSENT' : 'LATE';
        try {
          await p.attendance.upsert({
            where: { studentId_date: { studentId: student.id, date: today } },
            update: { status, markedById: teacher.id },
            create: { studentId: student.id, date: today, status, markedById: teacher.id },
          });
          attCount++;
        } catch {}
      }
    }
  }
  console.log(`Created ${attCount} attendance records for today`);

  // ─── 2. Seed syllabus for Classes 1-8 ──────────────────────
  console.log('\n--- Seeding syllabus for Classes 1-8 ---');

  const syllabusData = {
    primary: { // Classes 1-5
      'English': [
        { title: 'Alphabets & Phonics', topics: ['Vowels and Consonants', 'Blending Sounds', 'Sight Words'] },
        { title: 'Reading Comprehension', topics: ['Short Stories', 'Picture Reading', 'Answering Questions'] },
        { title: 'Grammar Basics', topics: ['Nouns', 'Verbs', 'Adjectives', 'Sentences'] },
        { title: 'Writing Skills', topics: ['Letter Writing', 'Story Writing', 'Paragraph Writing'] },
        { title: 'Poetry & Rhymes', topics: ['Recitation', 'Understanding Poems', 'Creative Poetry'] },
      ],
      'Mathematics': [
        { title: 'Numbers & Counting', topics: ['Place Value', 'Counting to 1000', 'Number Names'] },
        { title: 'Addition & Subtraction', topics: ['Single Digit', 'Double Digit', 'Word Problems'] },
        { title: 'Multiplication & Division', topics: ['Times Tables', 'Long Division', 'Applications'] },
        { title: 'Shapes & Geometry', topics: ['2D Shapes', '3D Shapes', 'Symmetry'] },
        { title: 'Measurement', topics: ['Length', 'Weight', 'Time', 'Money'] },
      ],
      'Hindi': [
        { title: 'वर्णमाला', topics: ['स्वर', 'व्यंजन', 'मात्राएं'] },
        { title: 'शब्द रचना', topics: ['संयुक्त अक्षर', 'शब्द बनाओ', 'वाक्य बनाओ'] },
        { title: 'कहानी पठन', topics: ['छोटी कहानियां', 'प्रश्न उत्तर', 'सारांश'] },
        { title: 'व्याकरण', topics: ['संज्ञा', 'सर्वनाम', 'क्रिया', 'विशेषण'] },
      ],
      'EVS': [
        { title: 'My Family & Surroundings', topics: ['Family Members', 'My House', 'My School'] },
        { title: 'Plants & Animals', topics: ['Parts of a Plant', 'Types of Animals', 'Food Chain'] },
        { title: 'Weather & Seasons', topics: ['Summer', 'Winter', 'Rainy Season', 'Spring'] },
        { title: 'Health & Hygiene', topics: ['Personal Hygiene', 'Healthy Food', 'Exercise'] },
      ],
    },
    middle: { // Classes 6-8
      'English': [
        { title: 'Prose & Fiction', topics: ['Short Stories', 'Novel Excerpts', 'Character Analysis'] },
        { title: 'Poetry', topics: ['Romantic Poetry', 'Modern Poetry', 'Poetic Devices'] },
        { title: 'Grammar & Composition', topics: ['Tenses', 'Voice', 'Direct-Indirect Speech', 'Clauses'] },
        { title: 'Writing', topics: ['Essay Writing', 'Letter Writing', 'Report Writing', 'Diary Entry'] },
        { title: 'Literature', topics: ['Drama', 'Shakespeare Introduction', 'Indian Authors'] },
        { title: 'Communication Skills', topics: ['Debate', 'Public Speaking', 'Group Discussion'] },
      ],
      'Mathematics': [
        { title: 'Integers & Fractions', topics: ['Operations on Integers', 'Fractions', 'Decimals'] },
        { title: 'Algebra', topics: ['Variables', 'Simple Equations', 'Linear Equations'] },
        { title: 'Geometry', topics: ['Lines & Angles', 'Triangles', 'Circles', 'Quadrilaterals'] },
        { title: 'Mensuration', topics: ['Area', 'Perimeter', 'Volume', 'Surface Area'] },
        { title: 'Data Handling', topics: ['Bar Graphs', 'Pie Charts', 'Mean Median Mode'] },
        { title: 'Ratio & Proportion', topics: ['Ratios', 'Proportions', 'Percentages', 'Profit & Loss'] },
      ],
      'Science': [
        { title: 'Physics - Motion & Force', topics: ['Speed & Velocity', 'Types of Force', 'Friction', 'Gravity'] },
        { title: 'Chemistry - Matter', topics: ['States of Matter', 'Elements & Compounds', 'Mixtures', 'Separation'] },
        { title: 'Biology - Living World', topics: ['Cell Structure', 'Plant Life', 'Animal Life', 'Human Body'] },
        { title: 'Light & Sound', topics: ['Reflection', 'Refraction', 'Sound Waves', 'Echo'] },
        { title: 'Electricity', topics: ['Electric Current', 'Circuits', 'Conductors', 'Magnets'] },
        { title: 'Environment', topics: ['Ecosystem', 'Pollution', 'Conservation', 'Climate Change'] },
      ],
      'Social Studies': [
        { title: 'Ancient History', topics: ['Indus Valley', 'Vedic Period', 'Maurya Empire'] },
        { title: 'Medieval History', topics: ['Delhi Sultanate', 'Mughal Empire', 'Vijayanagara'] },
        { title: 'Geography - India', topics: ['Physical Features', 'Climate', 'Rivers', 'Natural Resources'] },
        { title: 'Civics', topics: ['Constitution', 'Democracy', 'Fundamental Rights', 'Government'] },
        { title: 'Economics', topics: ['Resources', 'Agriculture', 'Industry', 'Trade'] },
      ],
    },
  };

  let syllCount = 0;
  for (let grade = 1; grade <= 8; grade++) {
    const cls = await p.class.findFirst({ where: { grade, schoolId: school.id } });
    if (!cls) continue;

    const subjectMap = grade <= 5 ? syllabusData.primary : syllabusData.middle;

    for (const [subjectName, chapters] of Object.entries(subjectMap)) {
      const subject = await p.subject.findFirst({ where: { classId: cls.id, name: subjectName } });
      if (!subject) continue;

      // Check if syllabus already exists
      const existing = await p.syllabus.findFirst({
        where: { subjectId: subject.id, classId: cls.id, academicSessionId: session.id },
      });
      if (existing) continue;

      const syllabus = await p.syllabus.create({
        data: { subjectId: subject.id, classId: cls.id, academicSessionId: session.id },
      });

      for (const [ci, ch] of chapters.entries()) {
        const chapter = await p.chapter.create({
          data: { syllabusId: syllabus.id, title: ch.title, orderIndex: ci + 1, estimatedHours: 10 },
        });
        for (const [ti, topicTitle] of ch.topics.entries()) {
          await p.topic.create({
            data: { chapterId: chapter.id, title: topicTitle, orderIndex: ti + 1, estimatedMinutes: 45 },
          });
        }
      }
      syllCount++;
    }
  }
  console.log(`Created ${syllCount} syllabi for Classes 1-8`);

  // ─── 3. Seed more question banks ───────────────────────────
  console.log('\n--- Seeding question banks ---');
  const qbData = [
    { name: 'Class 10 English', subjectName: 'English', grade: 10 },
    { name: 'Class 9 Mathematics', subjectName: 'Mathematics', grade: 9 },
    { name: 'Class 9 Science', subjectName: 'Science', grade: 9 },
    { name: 'Class 10 Hindi', subjectName: 'Hindi', grade: 10 },
  ];

  let qbCount = 0;
  for (const qb of qbData) {
    const cls = await p.class.findFirst({ where: { grade: qb.grade, schoolId: school.id } });
    if (!cls) continue;
    const subject = await p.subject.findFirst({ where: { classId: cls.id, name: qb.subjectName } });
    if (!subject) continue;

    const existing = await p.questionBank.findFirst({ where: { name: qb.name } });
    if (existing) continue;

    const bank = await p.questionBank.create({ data: { subjectId: subject.id, name: qb.name } });
    for (let i = 0; i < 10; i++) {
      await p.question.create({
        data: {
          bankId: bank.id,
          type: ['MCQ', 'SHORT_ANSWER', 'TRUE_FALSE', 'FILL_BLANK', 'MCQ'][i % 5],
          text: `${qb.subjectName} Question ${i + 1} for ${qb.name}`,
          marks: [1, 2, 1, 1, 2][i % 5],
          difficultyLevel: ['EASY', 'MEDIUM', 'HARD'][i % 3],
        },
      });
    }
    qbCount++;
  }
  console.log(`Created ${qbCount} question banks with 10 questions each`);

  // Print summary
  console.log('\n--- Summary ---');
  console.log('Attendance today:', await p.attendance.count({ where: { date: today } }));
  console.log('Total syllabi:', await p.syllabus.count());
  console.log('Total chapters:', await p.chapter.count());
  console.log('Total topics:', await p.topic.count());
  console.log('Question banks:', await p.questionBank.count());
  console.log('Questions:', await p.question.count());
}

main().catch(console.error).finally(() => p.$disconnect());
