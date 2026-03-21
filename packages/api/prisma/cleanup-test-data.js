const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  // Delete test question banks created by e2e tests
  const testBanks = await p.questionBank.findMany({
    where: { name: { contains: 'E2E Test' } },
    select: { id: true },
  });
  console.log(`Found ${testBanks.length} test question banks to delete`);

  for (const bank of testBanks) {
    await p.question.deleteMany({ where: { bankId: bank.id } });
    await p.questionBank.delete({ where: { id: bank.id } });
  }
  console.log('Deleted test question banks');

  // Also clean up test data from other modules
  const testStudents = await p.student.count({ where: { admissionNo: { contains: 'ADM-TEST' } } });
  console.log(`Test students: ${testStudents}`);

  // Count remaining real data
  console.log('\n--- Remaining Data ---');
  console.log('Question Banks:', await p.questionBank.count());
  console.log('Questions:', await p.question.count());
}

main().finally(() => p.$disconnect());
