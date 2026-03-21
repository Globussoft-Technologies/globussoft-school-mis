const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
async function main() {
  console.log('Users:', await p.user.count());
  console.log('Students:', await p.student.count());
  console.log('Enquiries:', await p.admissionEnquiry.count());
  console.log('Attendance:', await p.attendance.count());
  console.log('Subjects:', await p.subject.count());
  console.log('Syllabi:', await p.syllabus.count());
}
main().finally(() => p.$disconnect());
