const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const school = await p.school.findFirst();
  const session = await p.academicSession.findFirst();
  const teachers = await p.user.findMany({where:{role:'CLASS_TEACHER'},take:6});
  const admin = await p.user.findFirst({where:{role:'SUPER_ADMIN'}});
  const students = await p.student.findMany({take:25});
  const classes = await p.class.findMany({include:{sections:true},take:6});
  const subjects = await p.subject.findMany({take:10});
  const books = await p.libraryBook.findMany({take:15});
  const feeHeads = await p.feeHead.findMany({take:3});
  if (!school || !admin || !teachers.length) { console.log('Missing data'); return; }

  // 1. PayrollRecord (allowances, deductions, netSalary)
  console.log('--- Payroll ---');
  let c = 0;
  for (const t of teachers) {
    for (let m = 1; m <= 3; m++) {
      try { await p.payrollRecord.create({data:{userId:t.id,month:m,year:2026,basicSalary:45000,allowances:23000,deductions:5000,netSalary:63000,status:'PAID',paidAt:new Date(2026,m-1,28)}}); c++; } catch(e) {}
    }
  }
  console.log(`  ${c} payroll records`);

  // 2. DiaryEntry (needs type)
  console.log('--- Diary Entries ---');
  c = 0;
  const diaryTypes = ['HOMEWORK','CLASSWORK','NOTE','REMINDER','CIRCULAR'];
  const diaryContents = [
    'Math: Complete Ex 5.1 Q1-10. Science: Read Chapter 3.',
    'Hindi: Write essay on "My School". English: Grammar worksheet.',
    'Reminder: Bring art supplies tomorrow for craft class.',
    'Social Studies: Map work - India political map. Geography: Rivers.',
    'Computer Science: Practice HTML tags. Submit project by Friday.',
    'Science Lab: Bring lab coat and goggles for practical.',
    'PTM scheduled for March 28. Parents must attend.',
    'Sports Day practice at 2 PM. Wear sports uniform.',
  ];
  for (let d = 1; d <= 15; d++) {
    const date = new Date(2026, 2, d + 5);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const cls of classes.slice(0, 4)) {
      try {
        await p.diaryEntry.create({data:{date,classId:cls.id,sectionId:cls.sections[0]?.id,type:diaryTypes[c % diaryTypes.length],content:diaryContents[c % diaryContents.length],createdBy:teachers[c % teachers.length].id,isPublished:true}});
        c++;
      } catch(e) {}
    }
  }
  console.log(`  ${c} diary entries`);

  // 3. IdCard (validFrom, validTo, type)
  console.log('--- ID Cards ---');
  c = 0;
  for (const s of students) {
    try { await p.idCard.create({data:{userId:s.userId,cardNumber:`MIS-2026-${String(c+1).padStart(4,'0')}`,type:'STUDENT',validFrom:new Date(2026,3,1),validTo:new Date(2027,2,31),status:'ACTIVE'}}); c++; } catch(e) {}
  }
  for (const t of teachers) {
    try { await p.idCard.create({data:{userId:t.id,cardNumber:`MIS-T-${String(c+1).padStart(4,'0')}`,type:'TEACHER',validFrom:new Date(2026,3,1),validTo:new Date(2027,2,31),status:'ACTIVE'}}); c++; } catch(e) {}
  }
  console.log(`  ${c} ID cards`);

  // 4. StaffProfile (employeeId, dateOfJoining)
  console.log('--- Staff Profiles ---');
  c = 0;
  const depts = ['ACADEMIC','ACADEMIC','ACADEMIC','ADMINISTRATION','LIBRARY','SPORTS'];
  for (const t of teachers) {
    try { await p.staffProfile.create({data:{userId:t.id,employeeId:`EMP-${String(c+1).padStart(4,'0')}`,department:depts[c % depts.length],designation:'Senior Teacher',dateOfJoining:new Date(2020,5,1),qualification:'M.Ed., B.Sc.',experience:5+c*2}}); c++; } catch(e) {}
  }
  console.log(`  ${c} staff profiles`);

  // 5. TeacherAttendance (teacherId)
  console.log('--- Teacher Attendance ---');
  c = 0;
  for (let d = 1; d <= 22; d++) {
    const date = new Date(2026, 2, d);
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    for (const t of teachers) {
      try { await p.teacherAttendance.create({data:{teacherId:t.id,date,status:Math.random()>0.1?'PRESENT':'ABSENT',checkIn:'08:30',checkOut:'15:30'}}); c++; } catch(e) {}
    }
  }
  console.log(`  ${c} teacher attendance`);

  // 6. LeaveApplication (no schoolId)
  console.log('--- Leave Applications ---');
  c = 0;
  const reasons = ['Fever and cold','Family function','Medical appointment','Out of station','Religious ceremony','Personal work'];
  for (const s of students.slice(0, 12)) {
    try { await p.leaveApplication.create({data:{applicantId:s.userId,type:['SICK','CASUAL','EARNED'][c%3],startDate:new Date(2026,2,15+c%10),endDate:new Date(2026,2,17+c%10),reason:reasons[c%reasons.length],status:['APPROVED','PENDING','REJECTED'][c%3]}}); c++; } catch(e) {}
  }
  for (const t of teachers.slice(0, 3)) {
    try { await p.leaveApplication.create({data:{applicantId:t.id,type:'CASUAL',startDate:new Date(2026,2,20+c%5),endDate:new Date(2026,2,21+c%5),reason:'Personal work',status:'APPROVED'}}); c++; } catch(e) {}
  }
  console.log(`  ${c} leave applications`);

  // 7. LibraryIssue (issueDate not issuedAt)
  console.log('--- Library Issues ---');
  c = 0;
  for (const b of books) {
    try { await p.libraryIssue.create({data:{bookId:b.id,borrowerId:students[c % students.length].userId,issueDate:new Date(2026,2,1+c),dueDate:new Date(2026,2,15+c),status:c<8?'RETURNED':'ISSUED',returnDate:c<8?new Date(2026,2,10+c):null}}); c++; } catch(e) {}
  }
  console.log(`  ${c} library issues`);

  // 8. HealthRecord (Json fields, unique studentId)
  console.log('--- Health Records ---');
  c = 0;
  const bloodGroups = ['A+','B+','O+','AB+','A-','B-','O-'];
  for (const s of students) {
    try { await p.healthRecord.create({data:{studentId:s.id,bloodGroup:bloodGroups[c%7],height:130+Math.floor(Math.random()*40),weight:30+Math.floor(Math.random()*30),allergies:JSON.stringify(c%4===0?['Dust']:c%4===1?['Peanuts']:[]),conditions:JSON.stringify([]),medications:JSON.stringify([]),emergencyContact:'Parent',emergencyPhone:'98765'+String(c).padStart(5,'0'),lastCheckupDate:new Date(2026,1,15)}}); c++; } catch(e) {}
  }
  console.log(`  ${c} health records`);

  // 9. Concession (feeHeadId)
  console.log('--- Concessions ---');
  c = 0;
  if (feeHeads.length) {
    for (const s of students.slice(0, 8)) {
      try { await p.concession.create({data:{studentId:s.id,feeHeadId:feeHeads[c%feeHeads.length].id,type:['SCHOLARSHIP','SIBLING','MERIT','STAFF'][c%4],discountPercent:10+c*5,reason:'Merit-based discount',approvedBy:admin.id,status:'APPROVED'}}); c++; } catch(e) {}
    }
  }
  console.log(`  ${c} concessions`);

  // 10. StudentPoints (plural model name)
  console.log('--- Student Points ---');
  c = 0;
  const cats = ['ACADEMIC','ATTENDANCE','PARTICIPATION','HOMEWORK','EXTRA_CREDIT'];
  const pointReasons = ['Perfect attendance','Quiz winner','Best project','Helped in event','Sports champion'];
  for (const s of students) {
    for (let i = 0; i < 2; i++) {
      try { await p.studentPoints.create({data:{studentId:s.id,points:10+Math.floor(Math.random()*50),level:1+Math.floor(Math.random()*3),category:cats[(c+i)%cats.length],reason:pointReasons[(c+i)%pointReasons.length],awardedBy:teachers[0].id}}); c++; } catch(e) {}
    }
  }
  console.log(`  ${c} student points`);

  // 11. More Defaulter Records
  console.log('--- Defaulter Records ---');
  c = 0;
  for (const s of students.slice(10, 20)) {
    try { await p.defaulterRecord.create({data:{studentId:s.id,amount:5000+Math.floor(Math.random()*15000),dueDate:new Date(2026,1,28),status:'PENDING',remindersSent:Math.floor(Math.random()*3),lastReminderAt:new Date(2026,2,10)}}); c++; } catch(e) {}
  }
  console.log(`  ${c} defaulter records`);

  // 12. More Notifications
  console.log('--- Notifications ---');
  c = 0;
  const notifs = ['Fee payment due','New assignment posted','Report card published','PTM slot booked','Attendance alert','Library book overdue','Exam schedule released','Holiday announcement'];
  for (const s of students.slice(0,15)) {
    for (const n of notifs.slice(0,4)) {
      try { await p.notification.create({data:{userId:s.userId,title:n,message:`Dear student, ${n.toLowerCase()}. Please check your dashboard.`,type:'INFO',isRead:Math.random()>0.5}}); c++; } catch(e) {}
    }
  }
  console.log(`  ${c} notifications`);

  console.log('\n=== DEEP SEED 3 COMPLETE ===');
}
main().catch(e=>console.error(e)).finally(()=>p.$disconnect());
