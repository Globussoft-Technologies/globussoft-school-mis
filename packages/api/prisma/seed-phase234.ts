import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('=== Seeding Phase 2, 3, and 4 data ===\n');

  // ─── Look up existing entities ─────────────────────────────────────────────

  const school = await prisma.school.findFirst();
  if (!school) throw new Error('No school found. Run base seed first.');
  console.log(`Found school: ${school.name}`);

  const session = await prisma.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  if (!session) throw new Error('No active academic session found.');
  console.log(`Found session: ${session.name}`);

  // Get Class 10 and Class 9
  const class10 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 10 } });
  const class9 = await prisma.class.findFirst({ where: { schoolId: school.id, grade: 9 } });
  if (!class10) throw new Error('Class 10 not found.');
  if (!class9) throw new Error('Class 9 not found.');

  // Get sections for Class 10
  const section10A = await prisma.section.findFirst({ where: { classId: class10.id, name: 'A' } });
  const section10B = await prisma.section.findFirst({ where: { classId: class10.id, name: 'B' } });
  if (!section10A) throw new Error('Section 10A not found.');

  // Get subjects for Class 10
  const mathSubject = await prisma.subject.findFirst({ where: { classId: class10.id, name: 'Mathematics' } });
  const scienceSubject = await prisma.subject.findFirst({ where: { classId: class10.id, name: 'Science' } });
  if (!mathSubject) throw new Error('Math subject for Class 10 not found.');
  if (!scienceSubject) throw new Error('Science subject for Class 10 not found.');

  // Get teachers
  const teachers = await prisma.user.findMany({
    where: { schoolId: school.id, role: { in: ['CLASS_TEACHER', 'SUBJECT_TEACHER'] } },
  });
  if (teachers.length === 0) throw new Error('No teachers found.');
  const teacher1 = teachers[0];
  const teacher2 = teachers[1] || teachers[0];

  // Get students for Class 10A (up to 20)
  const class10AStudents = await prisma.student.findMany({
    where: { classId: class10.id, sectionId: section10A.id },
    take: 20,
    include: { user: true },
  });
  console.log(`Found ${class10AStudents.length} students in Class 10A`);

  // Get all students for Class 10
  const class10Students = await prisma.student.findMany({
    where: { classId: class10.id },
    take: 40,
    include: { user: true },
  });

  // Get all students for class 9 and 10
  const allStudents = await prisma.student.findMany({
    where: { class: { grade: { in: [9, 10] } } },
    take: 80,
    include: { user: true },
  });
  console.log(`Found ${allStudents.length} students in classes 9-10`);

  // Get admin user
  const adminUser = await prisma.user.findFirst({ where: { schoolId: school.id, role: 'SUPER_ADMIN' } });
  if (!adminUser) throw new Error('No admin user found.');

  // Summaries
  const summary = {
    lmsContent: 0,
    questionBanks: 0,
    questions: 0,
    assessments: 0,
    grades: 0,
    feeHeads: 0,
    payments: 0,
    defaulters: 0,
    incidents: 0,
    redFlags: 0,
    vehicles: 0,
    routes: 0,
    busAssignments: 0,
    hobbies: 0,
    hobbyEnrollments: 0,
    ptmSlots: 0,
    notifications: 0,
  };

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 2: LMS, Question Banks, Assessments, Grades
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n--- Phase 2: LMS, Question Banks, Assessments, Grades ---');

  // 1. LMS Content (10 items for Class 10 Math/Science)
  const lmsItems = [
    {
      title: 'Introduction to Quadratic Equations',
      description: 'Video lecture explaining the concept of quadratic equations and their standard form.',
      type: 'VIDEO',
      externalUrl: 'https://www.youtube.com/watch?v=example1',
      subjectId: mathSubject.id,
      classId: class10.id,
      uploadedBy: teacher1.id,
      isPublished: true,
      tags: ['quadratic', 'equations', 'algebra'],
      duration: 35,
      sortOrder: 1,
    },
    {
      title: 'Real Numbers - Complete Notes',
      description: 'Comprehensive PDF notes covering Euclid\'s Division Lemma and Fundamental Theorem of Arithmetic.',
      type: 'DOCUMENT',
      externalUrl: 'https://drive.google.com/file/example2',
      subjectId: mathSubject.id,
      classId: class10.id,
      uploadedBy: teacher1.id,
      isPublished: true,
      tags: ['real-numbers', 'euclid', 'hcf'],
      sortOrder: 2,
    },
    {
      title: 'Polynomials - Visual Presentation',
      description: 'PowerPoint presentation with graphs and diagrams for polynomials chapter.',
      type: 'PRESENTATION',
      externalUrl: 'https://slides.example.com/poly',
      subjectId: mathSubject.id,
      classId: class10.id,
      uploadedBy: teacher1.id,
      isPublished: true,
      tags: ['polynomials', 'zeros', 'graph'],
      sortOrder: 3,
    },
    {
      title: 'Trigonometry Ratios Explained',
      description: 'Detailed video on sin, cos, tan ratios with solved examples.',
      type: 'VIDEO',
      externalUrl: 'https://www.youtube.com/watch?v=example4',
      subjectId: mathSubject.id,
      classId: class10.id,
      uploadedBy: teacher1.id,
      isPublished: true,
      tags: ['trigonometry', 'ratios', 'sin', 'cos'],
      duration: 45,
      sortOrder: 4,
    },
    {
      title: 'Statistics - Practice Problems',
      description: 'Document with practice problems on mean, median, mode and frequency distributions.',
      type: 'DOCUMENT',
      externalUrl: 'https://drive.google.com/file/example5',
      subjectId: mathSubject.id,
      classId: class10.id,
      uploadedBy: teacher1.id,
      isPublished: false,
      tags: ['statistics', 'mean', 'median', 'mode'],
      sortOrder: 5,
    },
    {
      title: 'Chemical Reactions and Equations',
      description: 'Detailed video on types of chemical reactions with experiments.',
      type: 'VIDEO',
      externalUrl: 'https://www.youtube.com/watch?v=example6',
      subjectId: scienceSubject.id,
      classId: class10.id,
      uploadedBy: teacher2.id,
      isPublished: true,
      tags: ['chemistry', 'reactions', 'equations'],
      duration: 40,
      sortOrder: 1,
    },
    {
      title: 'Life Processes - Comprehensive Notes',
      description: 'Complete notes on nutrition, respiration, transport, and excretion in living organisms.',
      type: 'DOCUMENT',
      externalUrl: 'https://drive.google.com/file/example7',
      subjectId: scienceSubject.id,
      classId: class10.id,
      uploadedBy: teacher2.id,
      isPublished: true,
      tags: ['biology', 'life-processes', 'nutrition'],
      sortOrder: 2,
    },
    {
      title: 'Electricity - Concepts Presentation',
      description: 'Interactive presentation covering Ohm\'s law, resistance, and circuits.',
      type: 'PRESENTATION',
      externalUrl: 'https://slides.example.com/electricity',
      subjectId: scienceSubject.id,
      classId: class10.id,
      uploadedBy: teacher2.id,
      isPublished: true,
      tags: ['physics', 'electricity', 'ohm'],
      sortOrder: 3,
    },
    {
      title: 'Heredity and Evolution Video Series',
      description: 'Video series explaining Mendel\'s laws and Darwin\'s theory of evolution.',
      type: 'VIDEO',
      externalUrl: 'https://www.youtube.com/watch?v=example9',
      subjectId: scienceSubject.id,
      classId: class10.id,
      uploadedBy: teacher2.id,
      isPublished: true,
      tags: ['biology', 'heredity', 'evolution', 'mendel'],
      duration: 50,
      sortOrder: 4,
    },
    {
      title: 'Acids, Bases and Salts - Lab Guide',
      description: 'Document guiding students through pH indicators and common acid-base reactions.',
      type: 'DOCUMENT',
      externalUrl: 'https://drive.google.com/file/example10',
      subjectId: scienceSubject.id,
      classId: class10.id,
      uploadedBy: teacher2.id,
      isPublished: true,
      tags: ['chemistry', 'acids', 'bases', 'ph'],
      sortOrder: 5,
    },
  ];

  for (const item of lmsItems) {
    try {
      await prisma.lmsContent.create({ data: item });
      summary.lmsContent++;
    } catch (e) {
      console.log(`  Skipping LMS item (may already exist): ${item.title}`);
    }
  }
  console.log(`Created ${summary.lmsContent} LMS content items`);

  // 2. Question Banks (Math and Science with 15 questions each)
  let mathBank: any;
  let scienceBank: any;

  try {
    mathBank = await prisma.questionBank.create({
      data: { subjectId: mathSubject.id, name: 'Class 10 Mathematics Question Bank' },
    });
    summary.questionBanks++;
  } catch (e) {
    mathBank = await prisma.questionBank.findFirst({ where: { subjectId: mathSubject.id } });
    console.log('  Math question bank already exists, using existing.');
  }

  try {
    scienceBank = await prisma.questionBank.create({
      data: { subjectId: scienceSubject.id, name: 'Class 10 Science Question Bank' },
    });
    summary.questionBanks++;
  } catch (e) {
    scienceBank = await prisma.questionBank.findFirst({ where: { subjectId: scienceSubject.id } });
    console.log('  Science question bank already exists, using existing.');
  }

  const mathQuestions = [
    // MCQ
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'What is the discriminant of the equation x² - 5x + 6 = 0?',
      options: [
        { id: 'a', text: '1', isCorrect: true },
        { id: 'b', text: '49', isCorrect: false },
        { id: 'c', text: '-1', isCorrect: false },
        { id: 'd', text: '25', isCorrect: false },
      ],
      explanation: 'Discriminant = b² - 4ac = 25 - 24 = 1',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['quadratic', 'discriminant'],
    },
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'The HCF of 12 and 18 is:',
      options: [
        { id: 'a', text: '6', isCorrect: true },
        { id: 'b', text: '3', isCorrect: false },
        { id: 'c', text: '12', isCorrect: false },
        { id: 'd', text: '36', isCorrect: false },
      ],
      explanation: 'HCF(12, 18) = 6',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['hcf', 'real-numbers'],
    },
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'The number of zeroes of the polynomial p(x) = x³ - 3x is:',
      options: [
        { id: 'a', text: '3', isCorrect: true },
        { id: 'b', text: '0', isCorrect: false },
        { id: 'c', text: '1', isCorrect: false },
        { id: 'd', text: '2', isCorrect: false },
      ],
      explanation: 'x(x² - 3) = 0 gives x = 0, ±√3 → 3 zeros',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['polynomials', 'zeros'],
    },
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'If sin θ = 3/5, then cos θ is:',
      options: [
        { id: 'a', text: '4/5', isCorrect: true },
        { id: 'b', text: '3/4', isCorrect: false },
        { id: 'c', text: '5/4', isCorrect: false },
        { id: 'd', text: '5/3', isCorrect: false },
      ],
      explanation: 'cos θ = √(1 - sin²θ) = √(1 - 9/25) = √(16/25) = 4/5',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['trigonometry', 'ratios'],
    },
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'The mean of 5, 10, 15, 20, 25 is:',
      options: [
        { id: 'a', text: '15', isCorrect: true },
        { id: 'b', text: '10', isCorrect: false },
        { id: 'c', text: '20', isCorrect: false },
        { id: 'd', text: '12', isCorrect: false },
      ],
      explanation: 'Mean = (5+10+15+20+25)/5 = 75/5 = 15',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['statistics', 'mean'],
    },
    // TRUE_FALSE
    {
      bankId: mathBank.id,
      type: 'TRUE_FALSE',
      text: '√2 is a rational number.',
      correctAnswer: 'FALSE',
      explanation: '√2 is irrational as it cannot be expressed as p/q.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['real-numbers', 'irrational'],
    },
    {
      bankId: mathBank.id,
      type: 'TRUE_FALSE',
      text: 'Every polynomial of degree n has exactly n zeros.',
      correctAnswer: 'TRUE',
      explanation: 'By the fundamental theorem of algebra.',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['polynomials', 'zeros'],
    },
    {
      bankId: mathBank.id,
      type: 'TRUE_FALSE',
      text: 'sin 90° = 1',
      correctAnswer: 'TRUE',
      explanation: 'sin 90° = 1 is a standard trigonometric identity.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['trigonometry'],
    },
    // SHORT_ANSWER
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'Find the roots of the quadratic equation x² - 7x + 12 = 0.',
      correctAnswer: 'x = 3 and x = 4',
      explanation: 'Factoring: (x-3)(x-4) = 0',
      marks: 2,
      difficultyLevel: 'MEDIUM',
      tags: ['quadratic', 'roots'],
    },
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'Express 0.375 as a fraction in its simplest form.',
      correctAnswer: '3/8',
      explanation: '0.375 = 375/1000 = 3/8',
      marks: 2,
      difficultyLevel: 'EASY',
      tags: ['real-numbers', 'fractions'],
    },
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'If the sum of zeroes of a quadratic polynomial is 5 and product is 6, write the polynomial.',
      correctAnswer: 'x² - 5x + 6',
      explanation: 'p(x) = x² - (sum)x + product = x² - 5x + 6',
      marks: 2,
      difficultyLevel: 'MEDIUM',
      tags: ['polynomials', 'coefficients'],
    },
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'Find the value of sin²45° + cos²45°.',
      correctAnswer: '1',
      explanation: 'This is a trigonometric identity: sin²θ + cos²θ = 1',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['trigonometry', 'identities'],
    },
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'Find the median of: 3, 5, 7, 9, 11.',
      correctAnswer: '7',
      explanation: 'Median is the middle value of sorted data: 3,5,7,9,11 → 7',
      marks: 2,
      difficultyLevel: 'EASY',
      tags: ['statistics', 'median'],
    },
    {
      bankId: mathBank.id,
      type: 'SHORT_ANSWER',
      text: 'Solve: 2x + 3y = 7 and 3x - y = 5 using the elimination method.',
      correctAnswer: 'x = 2, y = 1',
      explanation: 'Multiply second eq by 3: 9x - 3y = 15, add to first: 11x = 22 → x=2, y=1',
      marks: 3,
      difficultyLevel: 'HARD',
      tags: ['linear-equations', 'elimination'],
    },
    {
      bankId: mathBank.id,
      type: 'MCQ',
      text: 'The area of a circle with radius 7 cm is (use π = 22/7):',
      options: [
        { id: 'a', text: '154 cm²', isCorrect: true },
        { id: 'b', text: '44 cm²', isCorrect: false },
        { id: 'c', text: '196 cm²', isCorrect: false },
        { id: 'd', text: '49 cm²', isCorrect: false },
      ],
      explanation: 'Area = πr² = (22/7) × 49 = 154 cm²',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['circles', 'area'],
    },
  ];

  const scienceQuestions = [
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'Which gas is produced when dilute HCl reacts with zinc?',
      options: [
        { id: 'a', text: 'Hydrogen', isCorrect: true },
        { id: 'b', text: 'Oxygen', isCorrect: false },
        { id: 'c', text: 'Chlorine', isCorrect: false },
        { id: 'd', text: 'Nitrogen', isCorrect: false },
      ],
      explanation: 'Zn + 2HCl → ZnCl₂ + H₂↑',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['chemistry', 'reactions'],
    },
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'Which organ is responsible for filtration of blood in the human body?',
      options: [
        { id: 'a', text: 'Kidney', isCorrect: true },
        { id: 'b', text: 'Liver', isCorrect: false },
        { id: 'c', text: 'Heart', isCorrect: false },
        { id: 'd', text: 'Lungs', isCorrect: false },
      ],
      explanation: 'Kidneys filter blood to produce urine.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['biology', 'excretion'],
    },
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'According to Ohm\'s law, if voltage doubles and resistance stays constant, current:',
      options: [
        { id: 'a', text: 'Doubles', isCorrect: true },
        { id: 'b', text: 'Halves', isCorrect: false },
        { id: 'c', text: 'Stays the same', isCorrect: false },
        { id: 'd', text: 'Quadruples', isCorrect: false },
      ],
      explanation: 'I = V/R; if V doubles, I doubles.',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['physics', 'electricity', 'ohm'],
    },
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'The pH of a neutral solution is:',
      options: [
        { id: 'a', text: '7', isCorrect: true },
        { id: 'b', text: '0', isCorrect: false },
        { id: 'c', text: '14', isCorrect: false },
        { id: 'd', text: '3', isCorrect: false },
      ],
      explanation: 'pH = 7 is neutral; < 7 acidic; > 7 basic.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['chemistry', 'acids-bases', 'ph'],
    },
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'Mendel\'s law of segregation applies to which generation?',
      options: [
        { id: 'a', text: 'F2 generation', isCorrect: true },
        { id: 'b', text: 'P generation', isCorrect: false },
        { id: 'c', text: 'F1 generation', isCorrect: false },
        { id: 'd', text: 'All generations', isCorrect: false },
      ],
      explanation: 'Segregation is most visible in the F2 generation ratios.',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['biology', 'heredity', 'mendel'],
    },
    {
      bankId: scienceBank.id,
      type: 'TRUE_FALSE',
      text: 'Carbon dioxide is produced during photosynthesis.',
      correctAnswer: 'FALSE',
      explanation: 'Oxygen is produced during photosynthesis; CO₂ is consumed.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['biology', 'photosynthesis'],
    },
    {
      bankId: scienceBank.id,
      type: 'TRUE_FALSE',
      text: 'Resistance of a conductor increases with increase in temperature.',
      correctAnswer: 'TRUE',
      explanation: 'For metallic conductors, resistance increases with temperature.',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['physics', 'electricity', 'resistance'],
    },
    {
      bankId: scienceBank.id,
      type: 'TRUE_FALSE',
      text: 'All acids turn blue litmus red.',
      correctAnswer: 'TRUE',
      explanation: 'Acids turn blue litmus to red; bases turn red litmus to blue.',
      marks: 1,
      difficultyLevel: 'EASY',
      tags: ['chemistry', 'acids'],
    },
    {
      bankId: scienceBank.id,
      type: 'SHORT_ANSWER',
      text: 'What is the balanced equation for the rusting of iron?',
      correctAnswer: '4Fe + 3O₂ + 6H₂O → 4Fe(OH)₃ or 2Fe₂O₃',
      explanation: 'Rusting is oxidation of iron in presence of moisture and oxygen.',
      marks: 2,
      difficultyLevel: 'MEDIUM',
      tags: ['chemistry', 'rusting', 'oxidation'],
    },
    {
      bankId: scienceBank.id,
      type: 'SHORT_ANSWER',
      text: 'Name the two chambers of the heart that pump blood to the lungs.',
      correctAnswer: 'Right ventricle (pumps to lungs); left ventricle (pumps to body)',
      explanation: 'Pulmonary circulation: right ventricle → lungs; systemic: left ventricle → body.',
      marks: 2,
      difficultyLevel: 'MEDIUM',
      tags: ['biology', 'circulatory-system'],
    },
    {
      bankId: scienceBank.id,
      type: 'SHORT_ANSWER',
      text: 'State Ohm\'s Law.',
      correctAnswer: 'At constant temperature, the current flowing through a conductor is directly proportional to the potential difference across its ends. V = IR.',
      explanation: 'V = IR where V = voltage, I = current, R = resistance.',
      marks: 2,
      difficultyLevel: 'EASY',
      tags: ['physics', 'electricity', 'ohm'],
    },
    {
      bankId: scienceBank.id,
      type: 'SHORT_ANSWER',
      text: 'What is the difference between acquired and inherited traits?',
      correctAnswer: 'Inherited traits are genetic (passed from parent to offspring). Acquired traits are developed during a lifetime and are not passed to offspring.',
      explanation: 'Only inherited traits are encoded in DNA and can be passed on.',
      marks: 3,
      difficultyLevel: 'MEDIUM',
      tags: ['biology', 'heredity', 'evolution'],
    },
    {
      bankId: scienceBank.id,
      type: 'MCQ',
      text: 'Which of the following is NOT a greenhouse gas?',
      options: [
        { id: 'a', text: 'Nitrogen (N₂)', isCorrect: true },
        { id: 'b', text: 'Carbon dioxide (CO₂)', isCorrect: false },
        { id: 'c', text: 'Methane (CH₄)', isCorrect: false },
        { id: 'd', text: 'Water vapour (H₂O)', isCorrect: false },
      ],
      explanation: 'N₂ makes up 78% of atmosphere but is not a greenhouse gas.',
      marks: 1,
      difficultyLevel: 'MEDIUM',
      tags: ['environment', 'greenhouse'],
    },
    {
      bankId: scienceBank.id,
      type: 'SHORT_ANSWER',
      text: 'What is the function of stomata in plants?',
      correctAnswer: 'Stomata allow gas exchange (CO₂ in, O₂ out during photosynthesis) and regulate water loss through transpiration.',
      explanation: 'Stomata are pores in leaves surrounded by guard cells.',
      marks: 2,
      difficultyLevel: 'EASY',
      tags: ['biology', 'plants', 'photosynthesis'],
    },
    {
      bankId: scienceBank.id,
      type: 'TRUE_FALSE',
      text: 'The magnetic field lines inside a solenoid are parallel and uniform.',
      correctAnswer: 'TRUE',
      explanation: 'Inside a solenoid, field lines are parallel, indicating a uniform magnetic field.',
      marks: 1,
      difficultyLevel: 'HARD',
      tags: ['physics', 'magnetism'],
    },
  ];

  for (const q of [...mathQuestions, ...scienceQuestions]) {
    try {
      await prisma.question.create({ data: q });
      summary.questions++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.questionBanks} question banks with ${summary.questions} questions`);

  // 3. Assessments (5 assessments: 1 per tier)
  const assessmentData = [
    {
      title: 'Math Micro Checkpoint - Real Numbers',
      type: 'CLASSWORK',
      tier: 1,
      subjectId: mathSubject.id,
      classId: class10.id,
      academicSessionId: session.id,
      createdBy: teacher1.id,
      totalMarks: 10,
      passingMarks: 4,
      duration: 20,
      instructions: 'Answer all questions. No negative marking.',
      scheduledDate: new Date('2026-04-10'),
      isPublished: true,
      isOnline: false,
    },
    {
      title: 'Science Cyclic Test - Life Processes',
      type: 'QUIZ',
      tier: 2,
      subjectId: scienceSubject.id,
      classId: class10.id,
      academicSessionId: session.id,
      createdBy: teacher2.id,
      totalMarks: 25,
      passingMarks: 10,
      duration: 40,
      instructions: 'Section A: MCQ (1 mark each). Section B: Short answers.',
      scheduledDate: new Date('2026-04-15'),
      isPublished: true,
      isOnline: false,
    },
    {
      title: 'Math Unit Assessment - Polynomials & Quadratics',
      type: 'UNIT_TEST',
      tier: 3,
      subjectId: mathSubject.id,
      classId: class10.id,
      academicSessionId: session.id,
      createdBy: teacher1.id,
      totalMarks: 40,
      passingMarks: 16,
      duration: 60,
      instructions: 'Attempt all sections. Show all working.',
      scheduledDate: new Date('2026-04-25'),
      isPublished: true,
      isOnline: false,
    },
    {
      title: 'Science Monthly Test - April',
      type: 'UNIT_TEST',
      tier: 4,
      subjectId: scienceSubject.id,
      classId: class10.id,
      academicSessionId: session.id,
      createdBy: teacher2.id,
      totalMarks: 50,
      passingMarks: 20,
      duration: 90,
      instructions: 'Three sections. Calculators not allowed.',
      scheduledDate: new Date('2026-04-30'),
      isPublished: false,
      isOnline: false,
    },
    {
      title: 'Mathematics Mid-Term Examination',
      type: 'MID_TERM',
      tier: 5,
      subjectId: mathSubject.id,
      classId: class10.id,
      academicSessionId: session.id,
      createdBy: teacher1.id,
      totalMarks: 80,
      passingMarks: 32,
      duration: 180,
      instructions: 'All questions compulsory. Use black/blue pen only.',
      scheduledDate: new Date('2026-06-15'),
      isPublished: false,
      isOnline: false,
    },
  ];

  const createdAssessments: any[] = [];
  for (const a of assessmentData) {
    try {
      const assessment = await prisma.assessment.create({ data: a });
      createdAssessments.push(assessment);
      summary.assessments++;
    } catch (e) {
      console.log(`  Skipping assessment (may already exist): ${a.title}`);
    }
  }
  console.log(`Created ${summary.assessments} assessments`);

  // 4. Grades - 20 students in Class 10A for Math
  const mathAssessment = createdAssessments.find(a => a.subjectId === mathSubject.id);
  if (mathAssessment && class10AStudents.length > 0) {
    const scoreVariants = [
      { score: 75, label: 'A+' },
      { score: 68, label: 'A' },
      { score: 62, label: 'B+' },
      { score: 55, label: 'B' },
      { score: 48, label: 'C' },
      { score: 40, label: 'C' },
      { score: 35, label: 'D' },
      { score: 25, label: 'F' },
      { score: 78, label: 'A+' },
      { score: 71, label: 'A' },
      { score: 65, label: 'A' },
      { score: 58, label: 'B+' },
      { score: 52, label: 'B' },
      { score: 44, label: 'C' },
      { score: 38, label: 'D' },
      { score: 80, label: 'A+' },
      { score: 73, label: 'A' },
      { score: 60, label: 'B+' },
      { score: 50, label: 'B' },
      { score: 30, label: 'F' },
    ];

    for (let i = 0; i < Math.min(class10AStudents.length, 20); i++) {
      const student = class10AStudents[i];
      const variant = scoreVariants[i % scoreVariants.length];
      try {
        await prisma.grade.create({
          data: {
            studentId: student.id,
            subjectId: mathSubject.id,
            assessmentId: mathAssessment.id,
            type: 'ASSESSMENT',
            marksObtained: variant.score,
            maxMarks: 80,
            percentage: parseFloat(((variant.score / 80) * 100).toFixed(2)),
            gradeLabel: variant.label,
            gradedBy: teacher1.id,
            remarks: variant.score >= 60 ? 'Good performance' : variant.score >= 40 ? 'Needs improvement' : 'Please see teacher',
          },
        });
        summary.grades++;
      } catch (e) {
        // skip duplicate
      }
    }
  }
  console.log(`Created ${summary.grades} grade entries`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 3: Fees, Payments, Defaulters, Discipline, Transport
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n--- Phase 3: Fees, Discipline, Transport ---');

  // 5. Fee Heads
  const feeHeadData = [
    {
      name: 'Tuition Fee',
      description: 'Monthly tuition fee for academics',
      amount: 3500,
      classId: class10.id,
      academicSessionId: session.id,
      isRecurring: true,
      frequency: 'MONTHLY',
      dueDay: 10,
    },
    {
      name: 'Transport Fee',
      description: 'Quarterly school bus transportation fee',
      amount: 4500,
      classId: class10.id,
      academicSessionId: session.id,
      isRecurring: true,
      frequency: 'QUARTERLY',
      dueDay: 5,
    },
    {
      name: 'Activity Fee',
      description: 'Annual fee for co-curricular activities and events',
      amount: 2000,
      classId: class10.id,
      academicSessionId: session.id,
      isRecurring: false,
      frequency: 'ANNUALLY',
      dueDay: 30,
    },
    {
      name: 'Examination Fee',
      description: 'One-time fee for board examination',
      amount: 1500,
      classId: class10.id,
      academicSessionId: session.id,
      isRecurring: false,
      frequency: 'ONE_TIME',
    },
    {
      name: 'Lab Fee',
      description: 'One-time lab consumables and equipment maintenance fee',
      amount: 800,
      classId: class10.id,
      academicSessionId: session.id,
      isRecurring: false,
      frequency: 'ONE_TIME',
    },
  ];

  const createdFeeHeads: any[] = [];
  for (const fh of feeHeadData) {
    try {
      const feeHead = await prisma.feeHead.create({ data: fh });
      createdFeeHeads.push(feeHead);
      summary.feeHeads++;
    } catch (e) {
      console.log(`  Skipping fee head (may already exist): ${fh.name}`);
      const existing = await prisma.feeHead.findFirst({ where: { name: fh.name, classId: class10.id, academicSessionId: session.id } });
      if (existing) createdFeeHeads.push(existing);
    }
  }
  console.log(`Created ${summary.feeHeads} fee heads`);

  // 6. Payments (30 payments - mix of PAID, PENDING, PARTIAL)
  const accountant = await prisma.user.findFirst({ where: { schoolId: school.id, role: 'ACCOUNTANT' } });
  const receiverId = accountant?.id || adminUser.id;

  const paymentStatuses = ['PAID', 'PAID', 'PAID', 'PENDING', 'PENDING', 'PARTIAL'];
  const paymentMethods = ['CASH', 'ONLINE', 'UPI', 'CHEQUE'];

  let receiptCounter = 1000;
  for (let i = 0; i < Math.min(30, class10Students.length * createdFeeHeads.length); i++) {
    const student = class10Students[i % class10Students.length];
    const feeHead = createdFeeHeads[i % createdFeeHeads.length];
    const status = paymentStatuses[i % paymentStatuses.length];
    const method = paymentMethods[i % paymentMethods.length];
    const amount = feeHead.amount;
    const paidAmount = status === 'PAID' ? amount : status === 'PARTIAL' ? amount * 0.5 : 0;

    try {
      await prisma.payment.create({
        data: {
          studentId: student.id,
          feeHeadId: feeHead.id,
          amount,
          paidAmount,
          discount: i % 10 === 0 ? amount * 0.1 : 0,
          method,
          transactionId: status !== 'PENDING' ? `TXN${Date.now()}${i}` : undefined,
          receiptNo: `RCP-2026-${String(receiptCounter + i).padStart(5, '0')}`,
          status,
          paidAt: status !== 'PENDING' ? new Date(`2026-04-${String((i % 28) + 1).padStart(2, '0')}`) : undefined,
          receivedBy: status !== 'PENDING' ? receiverId : undefined,
        },
      });
      summary.payments++;
    } catch (e) {
      // skip duplicate receipt numbers
    }
  }
  console.log(`Created ${summary.payments} payment records`);

  // 7. Defaulter Records (5 active defaulters)
  const pendingStudents = class10Students.slice(0, 5);
  for (let i = 0; i < pendingStudents.length && i < createdFeeHeads.length; i++) {
    try {
      await prisma.defaulterRecord.create({
        data: {
          studentId: pendingStudents[i].id,
          feeHeadId: createdFeeHeads[0].id,
          amountDue: createdFeeHeads[0].amount,
          dueDate: new Date('2026-04-10'),
          callAttempts: i + 1,
          lastCallAt: new Date(`2026-04-${String(i + 12).padStart(2, '0')}`),
          lastCallStatus: ['NO_ANSWER', 'PROMISED_TO_PAY', 'DISPUTED'][i % 3],
          smsSent: i + 1,
          status: 'ACTIVE',
        },
      });
      summary.defaulters++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.defaulters} defaulter records`);

  // 8. Incidents (8 discipline incidents)
  const incidentTypes = ['MISCONDUCT', 'BULLYING', 'PROPERTY_DAMAGE', 'CHEATING', 'ALTERCATION', 'UNIFORM_VIOLATION', 'MOBILE_USE', 'OTHER'];
  const severities = ['MINOR', 'MINOR', 'MODERATE', 'MINOR', 'SERIOUS', 'MINOR', 'MINOR', 'MODERATE'];
  const locations = ['Classroom 10A', 'School Corridor', 'Cafeteria', 'Library', 'Playground', 'Classroom 10B', 'Classroom 10A', 'Science Lab'];

  const incidentStudents = class10Students.slice(0, 8);
  const createdIncidents: any[] = [];

  for (let i = 0; i < incidentStudents.length; i++) {
    try {
      const incident = await prisma.incident.create({
        data: {
          studentId: incidentStudents[i].id,
          reportedBy: teacher1.id,
          date: new Date(`2026-04-${String(i + 3).padStart(2, '0')}`),
          time: `${String(9 + (i % 6)).padStart(2, '0')}:30`,
          type: incidentTypes[i],
          severity: severities[i],
          description: `Student was involved in ${incidentTypes[i].toLowerCase().replace('_', ' ')} incident. Observed by teacher during class period.`,
          witnesses: i > 0 ? [`Teacher ${teacher2.firstName}`, 'Class Monitor'] : [],
          location: locations[i],
          status: i < 3 ? 'RESOLVED' : i < 6 ? 'UNDER_REVIEW' : 'REPORTED',
        },
      });
      createdIncidents.push(incident);
      summary.incidents++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.incidents} discipline incidents`);

  // 9. Red Flags (2 auto-generated)
  const redFlagStudents = class10Students.slice(0, 2);
  for (let i = 0; i < redFlagStudents.length; i++) {
    const relevantIncidents = createdIncidents.filter(inc => inc.studentId === redFlagStudents[i].id);
    try {
      await prisma.redFlag.create({
        data: {
          studentId: redFlagStudents[i].id,
          reason: i === 0
            ? 'Student has 3 or more discipline incidents in the current month including a SERIOUS incident.'
            : 'Multiple fee defaulter records and attendance below 75% threshold.',
          autoGenerated: true,
          incidentIds: relevantIncidents.map(inc => inc.id),
          status: 'ACTIVE',
        },
      });
      summary.redFlags++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.redFlags} red flags`);

  // 10. Vehicles (3 buses)
  const vehicleData = [
    {
      number: 'MP-09-AB-1234',
      type: 'BUS',
      capacity: 50,
      driverName: 'Rajkumar Yadav',
      driverPhone: '9876543210',
      conductorName: 'Suresh Patel',
      conductorPhone: '9876543211',
      schoolId: school.id,
    },
    {
      number: 'MP-09-CD-5678',
      type: 'BUS',
      capacity: 45,
      driverName: 'Mukesh Singh',
      driverPhone: '9876543212',
      conductorName: 'Dinesh Kumar',
      conductorPhone: '9876543213',
      schoolId: school.id,
    },
    {
      number: 'MP-09-EF-9012',
      type: 'BUS',
      capacity: 40,
      driverName: 'Ramesh Verma',
      driverPhone: '9876543214',
      conductorName: 'Ganesh Sharma',
      conductorPhone: '9876543215',
      schoolId: school.id,
    },
  ];

  const createdVehicles: any[] = [];
  for (const v of vehicleData) {
    try {
      const vehicle = await prisma.vehicle.create({ data: v });
      createdVehicles.push(vehicle);
      summary.vehicles++;
    } catch (e) {
      console.log(`  Skipping vehicle (may already exist): ${v.number}`);
      const existing = await prisma.vehicle.findUnique({ where: { number: v.number } });
      if (existing) createdVehicles.push(existing);
    }
  }
  console.log(`Created ${summary.vehicles} vehicles`);

  // 11. Routes (3 routes with stops)
  const routeData = [
    {
      name: 'Route A - Vijay Nagar',
      description: 'Covers Vijay Nagar, Scheme 54, and Bhawarkua area',
      vehicleId: createdVehicles[0]?.id,
      schoolId: school.id,
      stops: [
        { name: 'Vijay Nagar Square', orderIndex: 1, estimatedArrival: '07:00', latitude: 22.7533, longitude: 75.8937 },
        { name: 'Scheme 54 Main Gate', orderIndex: 2, estimatedArrival: '07:10', latitude: 22.7480, longitude: 75.8870 },
        { name: 'Bhawarkua Chouraha', orderIndex: 3, estimatedArrival: '07:20', latitude: 22.7400, longitude: 75.8780 },
        { name: 'Annapurna Road', orderIndex: 4, estimatedArrival: '07:28', latitude: 22.7350, longitude: 75.8700 },
        { name: 'Medicaps School Gate', orderIndex: 5, estimatedArrival: '07:40', latitude: 22.7196, longitude: 75.8577 },
      ],
    },
    {
      name: 'Route B - Palasia',
      description: 'Covers Palasia, Rajwada, and MG Road area',
      vehicleId: createdVehicles[1]?.id,
      schoolId: school.id,
      stops: [
        { name: 'Palasia Chouraha', orderIndex: 1, estimatedArrival: '07:05', latitude: 22.7200, longitude: 75.8800 },
        { name: 'Rajwada Bus Stand', orderIndex: 2, estimatedArrival: '07:15', latitude: 22.7178, longitude: 75.8689 },
        { name: 'MG Road Central', orderIndex: 3, estimatedArrival: '07:22', latitude: 22.7160, longitude: 75.8620 },
        { name: 'Siyaganj Market', orderIndex: 4, estimatedArrival: '07:30', latitude: 22.7143, longitude: 75.8570 },
        { name: 'Medicaps School Gate', orderIndex: 5, estimatedArrival: '07:40', latitude: 22.7196, longitude: 75.8577 },
      ],
    },
    {
      name: 'Route C - Khajrana',
      description: 'Covers Khajrana, Nipania, and Aerodrome area',
      vehicleId: createdVehicles[2]?.id,
      schoolId: school.id,
      stops: [
        { name: 'Khajrana Temple', orderIndex: 1, estimatedArrival: '06:55', latitude: 22.7310, longitude: 75.9050 },
        { name: 'Nipania Main Road', orderIndex: 2, estimatedArrival: '07:05', latitude: 22.7280, longitude: 75.8980 },
        { name: 'Aerodrome Circle', orderIndex: 3, estimatedArrival: '07:15', latitude: 22.7250, longitude: 75.8900 },
        { name: 'LIG Colony Gate', orderIndex: 4, estimatedArrival: '07:25', latitude: 22.7220, longitude: 75.8820 },
        { name: 'Medicaps School Gate', orderIndex: 5, estimatedArrival: '07:40', latitude: 22.7196, longitude: 75.8577 },
      ],
    },
  ];

  const createdRoutes: any[] = [];
  const allStops: any[] = [];

  for (const routeDef of routeData) {
    const { stops, ...routeFields } = routeDef;
    try {
      const route = await prisma.route.create({ data: routeFields });
      createdRoutes.push(route);
      summary.routes++;

      for (const stopDef of stops) {
        const stop = await prisma.stop.create({
          data: { ...stopDef, routeId: route.id },
        });
        allStops.push({ ...stop, routeId: route.id });
      }
    } catch (e) {
      console.log(`  Skipping route (may already exist): ${routeFields.name}`);
      const existing = await prisma.route.findFirst({ where: { name: routeFields.name, schoolId: school.id } });
      if (existing) {
        createdRoutes.push(existing);
        const existingStops = await prisma.stop.findMany({ where: { routeId: existing.id } });
        allStops.push(...existingStops.map(s => ({ ...s, routeId: existing.id })));
      }
    }
  }
  console.log(`Created ${summary.routes} routes with ${allStops.length} stops`);

  // 12. Bus Assignments (assign 20 students to routes)
  const studentsForBus = allStudents.slice(0, 20);
  for (let i = 0; i < studentsForBus.length; i++) {
    const routeIndex = i % createdRoutes.length;
    const route = createdRoutes[routeIndex];
    const routeStops = allStops.filter(s => s.routeId === route.id);
    if (!route || routeStops.length === 0) continue;
    const stop = routeStops[i % routeStops.length];

    try {
      await prisma.busAssignment.create({
        data: {
          studentId: studentsForBus[i].id,
          routeId: route.id,
          stopId: stop.id,
          academicSessionId: session.id,
        },
      });
      summary.busAssignments++;
    } catch (e) {
      // skip if already assigned (unique constraint on studentId)
    }
  }
  console.log(`Created ${summary.busAssignments} bus assignments`);

  // ═══════════════════════════════════════════════════════════════════════════
  // PHASE 4: Hobbies, PTM, Notifications
  // ═══════════════════════════════════════════════════════════════════════════

  console.log('\n--- Phase 4: Hobbies, PTM, Notifications ---');

  // Get hobby coordinator
  const hobbyCoordinator = await prisma.user.findFirst({ where: { schoolId: school.id, role: 'HOBBY_COORDINATOR' } });
  const coordinatorId = hobbyCoordinator?.id || teacher1.id;

  // 13. Hobbies (8 hobbies)
  const hobbyData = [
    {
      name: 'Drawing & Sketching',
      category: 'VISUAL_ARTS',
      description: 'Learn pencil sketching, watercolours, and mixed media techniques.',
      maxCapacity: 20,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Classical Dance',
      category: 'PERFORMING_ARTS',
      description: 'Indian classical dance forms - Bharatanatyam and Kathak.',
      maxCapacity: 25,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Chess Club',
      category: 'SPORTS',
      description: 'Learn chess strategy, openings, and participate in tournaments.',
      maxCapacity: 30,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Robotics & Coding',
      category: 'TECHNOLOGY',
      description: 'Build robots using Arduino/Lego Mindstorms. Learn basic programming.',
      maxCapacity: 20,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Debate & Public Speaking',
      category: 'LITERARY',
      description: 'Improve communication skills through structured debates and speeches.',
      maxCapacity: 30,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Photography Club',
      category: 'PHOTOGRAPHY',
      description: 'Learn composition, lighting, and photo editing fundamentals.',
      maxCapacity: 20,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Music & Instruments',
      category: 'PERFORMING_ARTS',
      description: 'Learn guitar, keyboard or tabla. Practice individually and in ensemble.',
      maxCapacity: 25,
      coordinatorId,
      schoolId: school.id,
    },
    {
      name: 'Yoga & Mindfulness',
      category: 'SPORTS',
      description: 'Daily yoga practice for physical fitness and mental well-being.',
      maxCapacity: 40,
      coordinatorId,
      schoolId: school.id,
    },
  ];

  const createdHobbies: any[] = [];
  for (const hd of hobbyData) {
    try {
      const hobby = await prisma.hobby.create({ data: hd });
      createdHobbies.push(hobby);
      summary.hobbies++;
    } catch (e) {
      console.log(`  Skipping hobby (may already exist): ${hd.name}`);
      const existing = await prisma.hobby.findFirst({ where: { name: hd.name, schoolId: school.id } });
      if (existing) createdHobbies.push(existing);
    }
  }
  console.log(`Created ${summary.hobbies} hobbies`);

  // 14. Hobby Enrollments (40 enrollments)
  const levels = ['BEGINNER', 'BEGINNER', 'INTERMEDIATE', 'BEGINNER', 'ADVANCED'];
  const statuses = ['ENROLLED', 'ENROLLED', 'ENROLLED', 'WITHDRAWN', 'ENROLLED'];

  for (let i = 0; i < Math.min(40, allStudents.length * createdHobbies.length); i++) {
    const student = allStudents[i % allStudents.length];
    const hobby = createdHobbies[i % createdHobbies.length];
    try {
      await prisma.hobbyEnrollment.create({
        data: {
          studentId: student.id,
          hobbyId: hobby.id,
          academicSessionId: session.id,
          status: statuses[i % statuses.length],
          level: levels[i % levels.length],
        },
      });
      summary.hobbyEnrollments++;

      // Update current enrollment count on the hobby
      if (statuses[i % statuses.length] === 'ENROLLED') {
        await prisma.hobby.update({
          where: { id: hobby.id },
          data: { currentEnrollment: { increment: 1 } },
        });
      }
    } catch (e) {
      // skip duplicate (student, hobby, session unique constraint)
    }
  }
  console.log(`Created ${summary.hobbyEnrollments} hobby enrollments`);

  // 15. PTM Slots (5 upcoming)
  const ptmSlotData = [
    { date: new Date('2026-04-26'), startTime: '09:00', endTime: '09:20', classId: class10.id, teacherId: teacher1.id, maxBookings: 5 },
    { date: new Date('2026-04-26'), startTime: '09:20', endTime: '09:40', classId: class10.id, teacherId: teacher1.id, maxBookings: 5 },
    { date: new Date('2026-04-26'), startTime: '09:40', endTime: '10:00', classId: class10.id, teacherId: teacher1.id, maxBookings: 5 },
    { date: new Date('2026-04-26'), startTime: '10:00', endTime: '10:20', classId: class10.id, teacherId: teacher2.id, maxBookings: 5 },
    { date: new Date('2026-04-26'), startTime: '10:20', endTime: '10:40', classId: class10.id, teacherId: teacher2.id, maxBookings: 5 },
  ];

  for (const slot of ptmSlotData) {
    try {
      await prisma.pTMSlot.create({
        data: { ...slot, academicSessionId: session.id },
      });
      summary.ptmSlots++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.ptmSlots} PTM slots`);

  // 16. Notifications (20 notifications for various users)
  const notificationTypes = ['ATTENDANCE', 'TEST_RESULT', 'FEE_DUE', 'HOMEWORK', 'RED_FLAG', 'BUS', 'GENERAL'];
  const channels = ['PUSH', 'SMS', 'WHATSAPP', 'EMAIL'];
  const notifStatuses = ['SENT', 'SENT', 'READ', 'PENDING', 'SENT'];

  const notifTargets = [
    adminUser,
    teacher1,
    teacher2,
    ...class10AStudents.slice(0, 5).map(s => s.user),
  ].filter(Boolean);

  const notificationTemplates = [
    { title: 'Attendance Alert', message: 'Student attendance has fallen below 75%. Immediate action required.', type: 'ATTENDANCE' },
    { title: 'Test Result Published', message: 'Mathematics Unit Assessment results are now available. Please check your score.', type: 'TEST_RESULT' },
    { title: 'Fee Due Reminder', message: 'Tuition fee for April is due on 10th April 2026. Please pay to avoid late charges.', type: 'FEE_DUE' },
    { title: 'Homework Assigned', message: 'New homework for Mathematics has been assigned. Due date: Tomorrow.', type: 'HOMEWORK' },
    { title: 'Red Flag Alert', message: 'A student has been flagged for multiple discipline incidents. Please review.', type: 'RED_FLAG' },
    { title: 'Bus Delay Notification', message: 'Route A bus is delayed by approximately 15 minutes today due to traffic.', type: 'BUS' },
    { title: 'PTM Scheduled', message: 'Parent-Teacher Meeting is scheduled for 26th April 2026. Please book your slot.', type: 'GENERAL' },
    { title: 'New Study Material', message: 'New LMS content has been added for Class 10 Mathematics. Check your portal.', type: 'GENERAL' },
    { title: 'Exam Schedule Released', message: 'Mid-term examination schedule has been released. Mid-term starts 15th June 2026.', type: 'TEST_RESULT' },
    { title: 'Fee Receipt Generated', message: 'Payment receipt for Lab Fee has been generated. Download from the portal.', type: 'FEE_DUE' },
    { title: 'Hobby Enrollment Confirmed', message: 'Your enrollment in Drawing & Sketching club has been confirmed.', type: 'GENERAL' },
    { title: 'Discipline Incident Reported', message: 'An incident involving your ward has been reported. Please contact the school.', type: 'GENERAL' },
    { title: 'Attendance Update', message: '5 students marked absent today. Notifications sent to parents.', type: 'ATTENDANCE' },
    { title: 'Question Bank Updated', message: 'Class 10 Science question bank has been updated with 15 new questions.', type: 'GENERAL' },
    { title: 'Monthly Report Ready', message: 'Academic progress report for April 2026 is ready for review.', type: 'TEST_RESULT' },
    { title: 'Transport Route Change', message: 'Route B timings have been adjusted. New pickup time: 7:10 AM from Palasia.', type: 'BUS' },
    { title: 'Fee Defaulter Notice', message: '5 students have outstanding fees. Follow-up calls scheduled.', type: 'FEE_DUE' },
    { title: 'Assessment Published', message: 'Science Cyclic Test is now published. Students can view details.', type: 'TEST_RESULT' },
    { title: 'Syllabus Update', message: 'Class 10 Science syllabus has been updated. Please review the new content.', type: 'GENERAL' },
    { title: 'System Maintenance', message: 'The student portal will be under maintenance on Sunday 22nd March from 2-4 AM.', type: 'GENERAL' },
  ];

  for (let i = 0; i < 20; i++) {
    const target = notifTargets[i % notifTargets.length];
    const template = notificationTemplates[i];
    const status = notifStatuses[i % notifStatuses.length];

    try {
      await prisma.notification.create({
        data: {
          userId: target.id,
          title: template.title,
          message: template.message,
          type: template.type,
          channel: channels[i % channels.length],
          status,
          sentAt: status !== 'PENDING' ? new Date(`2026-04-${String((i % 28) + 1).padStart(2, '0')}`) : undefined,
          readAt: status === 'READ' ? new Date(`2026-04-${String((i % 28) + 2).padStart(2, '0')}`) : undefined,
          metadata: { source: 'seed-phase234', iteration: i },
        },
      });
      summary.notifications++;
    } catch (e) {
      // skip
    }
  }
  console.log(`Created ${summary.notifications} notifications`);

  // ─── Summary ───────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  SEEDING COMPLETE - SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n  Phase 2 (LMS & Assessments):');
  console.log(`    LMS Content Items   : ${summary.lmsContent}`);
  console.log(`    Question Banks      : ${summary.questionBanks}`);
  console.log(`    Questions           : ${summary.questions}`);
  console.log(`    Assessments         : ${summary.assessments}`);
  console.log(`    Grade Entries       : ${summary.grades}`);
  console.log('\n  Phase 3 (Finance, Discipline, Transport):');
  console.log(`    Fee Heads           : ${summary.feeHeads}`);
  console.log(`    Payments            : ${summary.payments}`);
  console.log(`    Defaulter Records   : ${summary.defaulters}`);
  console.log(`    Discipline Incidents: ${summary.incidents}`);
  console.log(`    Red Flags           : ${summary.redFlags}`);
  console.log(`    Vehicles (Buses)    : ${summary.vehicles}`);
  console.log(`    Routes              : ${summary.routes}`);
  console.log(`    Bus Assignments     : ${summary.busAssignments}`);
  console.log('\n  Phase 4 (Hobbies, PTM, Notifications):');
  console.log(`    Hobbies             : ${summary.hobbies}`);
  console.log(`    Hobby Enrollments   : ${summary.hobbyEnrollments}`);
  console.log(`    PTM Slots           : ${summary.ptmSlots}`);
  console.log(`    Notifications       : ${summary.notifications}`);
  console.log('\n═══════════════════════════════════════════════════════');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
