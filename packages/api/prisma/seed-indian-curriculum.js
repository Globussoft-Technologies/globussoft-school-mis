const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

// Indian CBSE Curriculum - Course Modules for all classes
const CURRICULUM = {
  // Classes 1-5 (Primary)
  primary: {
    'English': [
      { title: 'Alphabets & Phonics', items: ['Letter Recognition A-Z', 'Vowel Sounds', 'Consonant Sounds', 'Blending Practice'] },
      { title: 'Reading Basics', items: ['Sight Words', 'Simple Sentences', 'Short Stories', 'Picture Reading'] },
      { title: 'Grammar Foundation', items: ['Nouns - Naming Words', 'Verbs - Action Words', 'Adjectives - Describing Words', 'Articles A/An/The'] },
      { title: 'Creative Writing', items: ['My Family Essay', 'My School Essay', 'Picture Composition', 'Story Completion'] },
      { title: 'Poetry & Rhymes', items: ['Nursery Rhymes', 'Poem Recitation', 'Understanding Poetry', 'Creating Simple Poems'] },
    ],
    'Mathematics': [
      { title: 'Numbers & Counting', items: ['Counting 1-100', 'Place Value (Ones, Tens)', 'Number Names', 'Before/After Numbers'] },
      { title: 'Basic Operations', items: ['Addition Single Digit', 'Addition Double Digit', 'Subtraction Basics', 'Word Problems'] },
      { title: 'Multiplication Tables', items: ['Tables 2-5', 'Tables 6-10', 'Multiplication Word Problems', 'Quick Mental Math'] },
      { title: 'Shapes & Patterns', items: ['2D Shapes (Circle, Square, Triangle)', '3D Shapes (Cube, Sphere)', 'Pattern Recognition', 'Symmetry'] },
      { title: 'Measurement & Data', items: ['Length (cm, m)', 'Weight (g, kg)', 'Time (Hours, Minutes)', 'Money (Rupees, Paise)'] },
    ],
    'Hindi': [
      { title: 'वर्णमाला (Alphabets)', items: ['स्वर (Vowels)', 'व्यंजन (Consonants)', 'मात्राएं (Matras)', 'अक्षर लेखन (Writing)'] },
      { title: 'शब्द निर्माण (Word Formation)', items: ['दो अक्षर वाले शब्द', 'तीन अक्षर वाले शब्द', 'संयुक्त अक्षर', 'अनुस्वार-विसर्ग'] },
      { title: 'कहानी और कविता', items: ['छोटी कहानियां', 'बाल कविताएं', 'कहानी सुनाना', 'कविता पाठ'] },
      { title: 'व्याकरण (Grammar)', items: ['संज्ञा (Noun)', 'सर्वनाम (Pronoun)', 'क्रिया (Verb)', 'विशेषण (Adjective)'] },
    ],
    'EVS': [
      { title: 'My Family & Home', items: ['Family Members', 'Types of Houses', 'Festivals We Celebrate', 'Helping at Home'] },
      { title: 'Plants Around Us', items: ['Parts of a Plant', 'How Plants Grow', 'Types of Plants', 'Uses of Plants'] },
      { title: 'Animals & Birds', items: ['Pet Animals', 'Wild Animals', 'Birds Around Us', 'Animal Homes'] },
      { title: 'Our Body & Health', items: ['Body Parts', 'Five Senses', 'Good Habits', 'Healthy Food'] },
      { title: 'Our Environment', items: ['Air and Water', 'Weather & Seasons', 'Save Trees', 'Reduce Reuse Recycle'] },
    ],
    'Computer Science': [
      { title: 'Introduction to Computers', items: ['Parts of Computer', 'Uses of Computer', 'Starting & Shutting Down', 'Keyboard & Mouse'] },
      { title: 'MS Paint', items: ['Drawing Tools', 'Coloring', 'Shapes', 'Saving Your Work'] },
      { title: 'Typing Practice', items: ['Home Row Keys', 'Top Row Keys', 'Simple Words', 'Sentences'] },
    ],
  },

  // Classes 6-8 (Middle School)
  middle: {
    'English': [
      { title: 'Prose & Short Stories', items: ['Character Analysis', 'Plot Summary', 'Theme Identification', 'Moral of the Story', 'Comprehension Passages'] },
      { title: 'Poetry', items: ['Poem Analysis', 'Poetic Devices (Simile, Metaphor)', 'Rhyme Scheme', 'Appreciation Writing'] },
      { title: 'Grammar Advanced', items: ['Tenses (Past, Present, Future)', 'Active & Passive Voice', 'Direct & Indirect Speech', 'Subject-Verb Agreement', 'Prepositions'] },
      { title: 'Writing Skills', items: ['Essay Writing', 'Letter Writing (Formal & Informal)', 'Diary Entry', 'Story Writing', 'Notice Writing'] },
      { title: 'Literature', items: ['Drama Introduction', 'Indian Authors', 'Shakespeare Basics', 'Book Review Writing'] },
    ],
    'Mathematics': [
      { title: 'Number System', items: ['Integers', 'Fractions & Decimals', 'Rational Numbers', 'Exponents & Powers'] },
      { title: 'Algebra', items: ['Variables & Expressions', 'Simple Equations', 'Linear Equations in One Variable', 'Factorization'] },
      { title: 'Geometry', items: ['Lines & Angles', 'Triangles & Properties', 'Quadrilaterals', 'Circles', 'Construction'] },
      { title: 'Mensuration', items: ['Perimeter', 'Area of Plane Figures', 'Surface Area', 'Volume'] },
      { title: 'Data Handling', items: ['Mean, Median, Mode', 'Bar Graphs', 'Pie Charts', 'Probability Introduction'] },
      { title: 'Ratio & Proportion', items: ['Ratios', 'Proportions', 'Percentage', 'Profit & Loss', 'Simple Interest'] },
    ],
    'Science': [
      { title: 'Physics - Force & Motion', items: ['Speed & Velocity', 'Types of Forces', 'Friction', 'Pressure', 'Gravitation'] },
      { title: 'Chemistry - Matter', items: ['States of Matter', 'Elements & Compounds', 'Atoms & Molecules', 'Chemical Reactions'] },
      { title: 'Biology - Life Processes', items: ['Cell Structure', 'Nutrition', 'Respiration', 'Reproduction in Plants', 'Human Body Systems'] },
      { title: 'Light & Sound', items: ['Reflection of Light', 'Refraction', 'Dispersion', 'Sound Waves', 'Human Ear'] },
      { title: 'Electricity & Magnetism', items: ['Electric Current', 'Circuits', 'Conductors & Insulators', 'Magnets', 'Electromagnets'] },
    ],
    'Social Studies': [
      { title: 'History - Ancient India', items: ['Indus Valley Civilization', 'Vedic Period', 'Maurya Empire', 'Gupta Empire'] },
      { title: 'History - Medieval India', items: ['Delhi Sultanate', 'Mughal Empire', 'Bhakti & Sufi Movement', 'Vijayanagara Kingdom'] },
      { title: 'Geography - India', items: ['Physical Features of India', 'Climate of India', 'Major Rivers', 'Natural Vegetation', 'Soil Types'] },
      { title: 'Civics', items: ['Indian Constitution', 'Fundamental Rights', 'Democracy', 'Parliament', 'Judiciary'] },
      { title: 'Economics', items: ['Resources', 'Agriculture', 'Industries', 'Human Resources'] },
    ],
    'Hindi': [
      { title: 'गद्य (Prose)', items: ['कहानी पठन', 'पात्र विश्लेषण', 'सारांश लेखन', 'प्रश्नोत्तर'] },
      { title: 'पद्य (Poetry)', items: ['कविता पठन', 'कविता का भावार्थ', 'अलंकार', 'छंद'] },
      { title: 'व्याकरण', items: ['संधि', 'समास', 'उपसर्ग-प्रत्यय', 'मुहावरे-लोकोक्तियां', 'पर्यायवाची-विलोम'] },
      { title: 'लेखन कौशल', items: ['निबंध लेखन', 'पत्र लेखन', 'अनुच्छेद लेखन', 'संवाद लेखन'] },
    ],
    'Sanskrit': [
      { title: 'पाठ्यपुस्तक', items: ['श्लोक पठन', 'अर्थ ग्रहण', 'प्रश्नोत्तर'] },
      { title: 'व्याकरण', items: ['संज्ञा शब्द रूप', 'धातु रूप', 'कारक', 'संधि'] },
      { title: 'लेखन', items: ['संस्कृत अनुवाद', 'चित्र वर्णन', 'पत्र लेखन'] },
    ],
    'Computer Science': [
      { title: 'Computer Fundamentals', items: ['Hardware & Software', 'Operating Systems', 'File Management', 'Internet Basics'] },
      { title: 'MS Office', items: ['MS Word', 'MS Excel', 'MS PowerPoint', 'Formatting & Design'] },
      { title: 'Introduction to Coding', items: ['What is Programming', 'Scratch Basics', 'Algorithms', 'Flowcharts'] },
      { title: 'Internet & Safety', items: ['Web Browsing', 'Email', 'Cyber Safety', 'Digital Citizenship'] },
    ],
  },

  // Classes 9-10 (Secondary - CBSE Board)
  secondary: {
    'English': [
      { title: 'First Flight (Prose)', items: ['A Letter to God', 'Nelson Mandela', 'Two Stories about Flying', 'From the Diary of Anne Frank', 'The Hundred Dresses'] },
      { title: 'First Flight (Poetry)', items: ['Dust of Snow', 'Fire and Ice', 'A Tiger in the Zoo', 'The Ball Poem', 'Amanda'] },
      { title: 'Footprints Without Feet', items: ['A Triumph of Surgery', 'The Thief Story', 'Footprints Without Feet', 'The Making of a Scientist', 'The Necklace'] },
      { title: 'Grammar & Writing', items: ['Tenses Review', 'Modals', 'Subject-Verb Concord', 'Reported Speech', 'Letter & Email Writing', 'Analytical Paragraph'] },
    ],
    'Mathematics': [
      { title: 'Real Numbers', items: ['Euclids Division Lemma', 'Fundamental Theorem of Arithmetic', 'Irrational Numbers', 'Decimal Expansions of Rationals'] },
      { title: 'Polynomials', items: ['Zeros of a Polynomial', 'Relationship Between Zeros & Coefficients', 'Division Algorithm'] },
      { title: 'Pair of Linear Equations', items: ['Graphical Method', 'Substitution Method', 'Elimination Method', 'Cross-Multiplication', 'Word Problems'] },
      { title: 'Quadratic Equations', items: ['Standard Form', 'Solution by Factorization', 'Quadratic Formula', 'Nature of Roots'] },
      { title: 'Arithmetic Progressions', items: ['nth Term of AP', 'Sum of n Terms', 'Applications of AP'] },
      { title: 'Triangles', items: ['Similar Triangles', 'Criteria for Similarity', 'Pythagoras Theorem', 'Areas of Similar Triangles'] },
      { title: 'Coordinate Geometry', items: ['Distance Formula', 'Section Formula', 'Area of Triangle'] },
      { title: 'Trigonometry', items: ['Trigonometric Ratios', 'Ratios of Specific Angles', 'Complementary Angles', 'Trigonometric Identities'] },
      { title: 'Heights & Distances', items: ['Angle of Elevation', 'Angle of Depression', 'Applications'] },
      { title: 'Statistics & Probability', items: ['Mean of Grouped Data', 'Median & Mode', 'Ogive Curves', 'Classical Probability'] },
    ],
    'Science': [
      { title: 'Chemical Reactions & Equations', items: ['Types of Reactions', 'Balancing Equations', 'Effects of Oxidation', 'Corrosion & Rancidity'] },
      { title: 'Acids, Bases & Salts', items: ['Properties of Acids & Bases', 'pH Scale', 'Salts & Their Properties', 'Chemicals from Common Salt'] },
      { title: 'Metals & Non-Metals', items: ['Physical Properties', 'Chemical Properties', 'Reactivity Series', 'Extraction of Metals'] },
      { title: 'Carbon & Its Compounds', items: ['Bonding in Carbon', 'Hydrocarbons', 'Functional Groups', 'Soaps & Detergents'] },
      { title: 'Life Processes', items: ['Nutrition', 'Respiration', 'Transportation', 'Excretion'] },
      { title: 'Control & Coordination', items: ['Nervous System', 'Hormones', 'Reflex Actions', 'Plant Hormones'] },
      { title: 'Heredity & Evolution', items: ['Mendels Laws', 'Sex Determination', 'Evolution', 'Speciation'] },
      { title: 'Light - Reflection & Refraction', items: ['Laws of Reflection', 'Mirror Formula', 'Refraction through Lens', 'Power of Lens'] },
      { title: 'Electricity', items: ['Ohms Law', 'Resistance', 'Series & Parallel Circuits', 'Electric Power'] },
      { title: 'Magnetic Effects of Current', items: ['Magnetic Field', 'Flemings Rules', 'Electric Motor', 'Electromagnetic Induction'] },
    ],
    'Hindi': [
      { title: 'क्षितिज (गद्य)', items: ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'बालगोबिन भगत', 'नेताजी का चश्मा', 'मानवीय करुणा की दिव्य चमक'] },
      { title: 'क्षितिज (पद्य)', items: ['उत्साह', 'अट नहीं रही है', 'यह दंतुरित मुस्कान', 'फसल', 'छाया मत छूना'] },
      { title: 'कृतिका', items: ['माता का आँचल', 'जॉर्ज पंचम की नाक', 'साना-साना हाथ जोड़ि', 'एही ठैयाँ झुलनी हेरानी हो रामा'] },
      { title: 'व्याकरण', items: ['रचना के आधार पर वाक्य', 'वाच्य', 'पद परिचय', 'रस'] },
    ],
    'Social Studies': [
      { title: 'History - India & Contemporary World', items: ['Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of Global World', 'Age of Industrialisation', 'Print Culture'] },
      { title: 'Geography - Contemporary India', items: ['Resources & Development', 'Forest & Wildlife', 'Water Resources', 'Agriculture', 'Minerals & Energy', 'Manufacturing Industries'] },
      { title: 'Political Science - Democratic Politics', items: ['Power Sharing', 'Federalism', 'Democracy & Diversity', 'Gender Religion Caste', 'Political Parties', 'Outcomes of Democracy'] },
      { title: 'Economics - Understanding Economic Development', items: ['Development', 'Sectors of Indian Economy', 'Money & Credit', 'Globalisation', 'Consumer Rights'] },
    ],
    'Computer Science': [
      { title: 'Networking & Internet', items: ['Computer Networks', 'Internet Protocols', 'Web Technologies', 'Cyber Security'] },
      { title: 'HTML & Web Development', items: ['HTML Tags', 'Forms & Tables', 'CSS Basics', 'Web Page Design'] },
      { title: 'Introduction to Python', items: ['Python Basics', 'Variables & Data Types', 'Operators', 'Control Structures', 'Functions'] },
      { title: 'Database Concepts', items: ['What is a Database', 'SQL Basics', 'Creating Tables', 'Queries'] },
    ],
    'Physical Education': [
      { title: 'Health & Fitness', items: ['Physical Fitness Components', 'Balanced Diet', 'Common Sports Injuries', 'First Aid'] },
      { title: 'Sports & Games', items: ['Athletics', 'Team Sports Rules', 'Individual Sports', 'Yoga & Meditation'] },
    ],
  },

  // Classes 11-12 (Senior Secondary)
  senior: {
    'English': [
      { title: 'Hornbill (Prose)', items: ['The Portrait of a Lady', 'We Are Not Afraid to Die', 'Discovering Tut', 'The Ailing Planet', 'The Browning Version'] },
      { title: 'Hornbill (Poetry)', items: ['A Photograph', 'The Laburnum Top', 'The Voice of the Rain', 'Childhood', 'Father to Son'] },
      { title: 'Snapshots', items: ['The Summer of the Beautiful White Horse', 'The Address', 'Ranga\'s Marriage', 'Albert Einstein at School'] },
      { title: 'Writing & Grammar', items: ['Notice & Poster Writing', 'Article Writing', 'Report Writing', 'Speech Writing', 'Debate'] },
    ],
    'Mathematics': [
      { title: 'Sets & Functions', items: ['Sets', 'Relations & Functions', 'Trigonometric Functions'] },
      { title: 'Algebra', items: ['Complex Numbers', 'Quadratic Equations', 'Linear Inequalities', 'Permutations & Combinations', 'Binomial Theorem', 'Sequences & Series'] },
      { title: 'Coordinate Geometry', items: ['Straight Lines', 'Conic Sections', 'Introduction to 3D Geometry'] },
      { title: 'Calculus', items: ['Limits & Derivatives', 'Differentiation', 'Applications of Derivatives', 'Integration', 'Applications of Integrals'] },
      { title: 'Statistics & Probability', items: ['Measures of Dispersion', 'Probability', 'Random Variables', 'Probability Distribution'] },
    ],
    'Physics': [
      { title: 'Mechanics', items: ['Units & Measurement', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work Energy Power'] },
      { title: 'Gravitation & Properties of Matter', items: ['Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties'] },
      { title: 'Thermodynamics', items: ['Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory of Gases'] },
      { title: 'Waves & Oscillations', items: ['Oscillations', 'Waves', 'Sound Waves'] },
      { title: 'Electrostatics & Current', items: ['Electric Charges', 'Electrostatic Potential', 'Current Electricity', 'EMF & Internal Resistance'] },
      { title: 'Optics', items: ['Ray Optics', 'Wave Optics', 'Optical Instruments'] },
    ],
    'Chemistry': [
      { title: 'Structure of Atom', items: ['Atomic Models', 'Quantum Numbers', 'Electronic Configuration', 'Periodic Table'] },
      { title: 'Chemical Bonding', items: ['Ionic Bond', 'Covalent Bond', 'VSEPR Theory', 'Hybridization', 'Molecular Orbital Theory'] },
      { title: 'States of Matter', items: ['Gas Laws', 'Ideal Gas Equation', 'Liquefaction', 'Liquid State'] },
      { title: 'Organic Chemistry', items: ['Nomenclature', 'Isomerism', 'Hydrocarbons', 'Organic Reactions'] },
      { title: 'Equilibrium', items: ['Chemical Equilibrium', 'Ionic Equilibrium', 'pH & Buffers', 'Solubility'] },
    ],
    'Biology': [
      { title: 'Cell Biology', items: ['Cell Structure', 'Cell Division', 'Biomolecules', 'Cell Cycle'] },
      { title: 'Plant Physiology', items: ['Photosynthesis', 'Respiration in Plants', 'Plant Growth', 'Mineral Nutrition'] },
      { title: 'Human Physiology', items: ['Digestion', 'Breathing', 'Body Fluids & Circulation', 'Excretion', 'Neural Control'] },
      { title: 'Genetics', items: ['Molecular Basis of Inheritance', 'Principles of Inheritance', 'Biotechnology', 'Genetic Engineering'] },
      { title: 'Ecology', items: ['Organisms & Environment', 'Ecosystem', 'Biodiversity', 'Environmental Issues'] },
    ],
    'Computer Science': [
      { title: 'Python Programming', items: ['Data Types & Operators', 'Control Flow', 'Functions', 'Strings', 'Lists & Tuples', 'Dictionaries'] },
      { title: 'Data Structures', items: ['Stacks', 'Queues', 'Sorting Algorithms', 'Searching Algorithms'] },
      { title: 'Database Management', items: ['RDBMS Concepts', 'SQL Commands (DDL, DML)', 'Aggregate Functions', 'Joins', 'MySQL Practical'] },
      { title: 'Networking', items: ['Network Concepts', 'Network Devices', 'Protocols', 'Network Security', 'Web Services'] },
    ],
  },
};

async function main() {
  const school = await p.school.findFirst();
  const session = await p.academicSession.findFirst({ where: { status: 'ACTIVE' } });
  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  if (!school || !session || !teacher) { console.log('Missing school/session/teacher'); return; }

  let totalModules = 0, totalItems = 0;

  for (let grade = 1; grade <= 12; grade++) {
    const cls = await p.class.findFirst({ where: { grade, schoolId: school.id } });
    if (!cls) { console.log(`  No Class ${grade}`); continue; }

    let curriculum;
    if (grade <= 5) curriculum = CURRICULUM.primary;
    else if (grade <= 8) curriculum = CURRICULUM.middle;
    else if (grade <= 10) curriculum = CURRICULUM.secondary;
    else curriculum = CURRICULUM.senior;

    for (const [subjectName, modules] of Object.entries(curriculum)) {
      const subject = await p.subject.findFirst({ where: { classId: cls.id, name: subjectName } });
      if (!subject) continue;

      for (const [mi, mod] of modules.entries()) {
        // Check if already exists
        const existing = await p.courseModule.findFirst({
          where: { classId: cls.id, subjectId: subject.id, title: mod.title },
        });
        if (existing) continue;

        const courseModule = await p.courseModule.create({
          data: {
            title: mod.title,
            description: `${subjectName} - ${mod.title} for Class ${grade}`,
            classId: cls.id,
            subjectId: subject.id,
            orderIndex: mi + 1,
            isPublished: true,
            unlockType: mi === 0 ? 'ALWAYS' : 'SEQUENTIAL',
            completionCriteria: 'VIEW_ALL',
            estimatedMinutes: mod.items.length * 30,
            createdBy: teacher.id,
          },
        });

        for (const [ii, itemTitle] of mod.items.entries()) {
          const types = ['CONTENT', 'VIDEO', 'DOCUMENT', 'QUIZ', 'ASSIGNMENT'];
          await p.courseModuleItem.create({
            data: {
              moduleId: courseModule.id,
              title: itemTitle,
              type: types[ii % types.length],
              orderIndex: ii + 1,
              isRequired: true,
              estimatedMinutes: 30,
            },
          });
          totalItems++;
        }
        totalModules++;
      }
    }
    process.stdout.write(`Class ${grade}: done | Total: ${totalModules} modules, ${totalItems} items\r`);
  }

  console.log(`\n\n=== Indian CBSE Curriculum Seeded ===`);
  console.log(`Course Modules: ${totalModules}`);
  console.log(`Module Items: ${totalItems}`);
  console.log(`Total in DB: ${await p.courseModule.count()} modules, ${await p.courseModuleItem.count()} items`);
}

main().catch(console.error).finally(() => p.$disconnect());
