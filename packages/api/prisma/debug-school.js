const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const schools = await p.school.findMany();
  console.log('Schools:', schools.map(s => `${s.id} = ${s.name}`));

  const jwtSchoolId = '0bf54848-9d4f-408a-87fa-082bdfc9bc57';
  const classesForJwt = await p.class.count({ where: { schoolId: jwtSchoolId } });
  console.log(`Classes for JWT schoolId (${jwtSchoolId}):`, classesForJwt);

  const totalClasses = await p.class.count();
  console.log('Total classes:', totalClasses);

  if (schools.length > 0) {
    const classesForFirstSchool = await p.class.count({ where: { schoolId: schools[0].id } });
    console.log(`Classes for first school (${schools[0].id}):`, classesForFirstSchool);
  }
}

main().finally(() => p.$disconnect());
