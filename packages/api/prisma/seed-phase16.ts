import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function generateCardNumber(): string {
  const year = new Date().getFullYear();
  const num = Math.floor(Math.random() * 900000) + 100000;
  return `ID-${year}-${num}`;
}

async function main() {
  console.log('Seeding Phase 16: ID Cards and Message Logs...');

  const users = await prisma.user.findMany({ take: 5 });
  if (users.length === 0) {
    throw new Error('No users found. Run the main seed first.');
  }
  console.log(`Found ${users.length} users`);

  // ─── ID Cards ──────────────────────────────────────────────────

  console.log('Creating 5 ID cards...');
  const cardTypes = ['STUDENT', 'TEACHER', 'STAFF', 'STUDENT', 'TEACHER'];
  const cardStatuses = ['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'LOST'];

  for (let i = 0; i < 5; i++) {
    const user = users[i % users.length];
    let cardNumber = generateCardNumber();

    // Ensure uniqueness
    let exists = await prisma.idCard.findUnique({ where: { cardNumber } });
    let attempt = 0;
    while (exists && attempt < 10) {
      cardNumber = generateCardNumber();
      exists = await prisma.idCard.findUnique({ where: { cardNumber } });
      attempt++;
    }

    const validFrom = new Date();
    validFrom.setMonth(validFrom.getMonth() - (i * 3));

    const validTo = new Date(validFrom);
    validTo.setFullYear(validTo.getFullYear() + 1);

    const status = cardStatuses[i];

    try {
      await prisma.idCard.create({
        data: {
          userId: user.id,
          cardNumber,
          type: cardTypes[i],
          validFrom,
          validTo,
          status,
          printedAt: status === 'ACTIVE' ? new Date() : null,
        },
      });
      console.log(`  Created ID card ${cardNumber} for user ${user.firstName} ${user.lastName} [${cardTypes[i]}]`);
    } catch (e: any) {
      console.log(`  Skipped: ${e.message}`);
    }
  }

  // ─── Message Logs ──────────────────────────────────────────────

  console.log('Creating 10 message logs...');
  const msgTypes = ['SMS', 'EMAIL', 'WHATSAPP', 'PUSH', 'SMS', 'EMAIL', 'WHATSAPP', 'SMS', 'EMAIL', 'PUSH'];
  const msgStatuses = ['DELIVERED', 'SENT', 'DELIVERED', 'FAILED', 'QUEUED', 'DELIVERED', 'SENT', 'FAILED', 'DELIVERED', 'QUEUED'];
  const providers = ['MSG91', 'SMTP', 'MSG91', 'FCM', 'MSG91', 'SMTP', 'MSG91', 'MSG91', 'SMTP', 'FCM'];

  const sampleMessages = [
    { subject: 'Fee Reminder', content: 'Your fee payment of Rs. 5000 is due on 25th March 2026. Please pay at the earliest.' },
    { subject: 'Attendance Alert', content: 'Your ward Rahul has been marked absent today (20 Mar 2026). Please contact the school if this is incorrect.' },
    { subject: 'Exam Schedule', content: 'Half yearly examinations begin from 1st April 2026. Admit cards can be collected from school office.' },
    { subject: 'Parent Meeting', content: 'Parent-teacher meeting scheduled on 28th March 2026 from 9:00 AM to 1:00 PM. Your presence is requested.' },
    { subject: 'Result Published', content: 'Unit test results for your ward have been published. Please check the parent portal.' },
    { subject: 'Holiday Notice', content: 'School will remain closed on 25th March 2026 on account of Holi. Classes will resume on 26th March 2026.' },
    { subject: 'Library Due', content: 'Books issued to your child are due for return on 22nd March 2026. Please ensure timely return to avoid fines.' },
    { subject: 'Sports Day', content: 'Annual Sports Day will be held on 5th April 2026. Students are requested to register for events.' },
    { subject: 'Assignment Reminder', content: 'Assignment for Mathematics Chapter 5 is due tomorrow. Students who have not submitted are requested to do so.' },
    { subject: 'App Notification', content: 'New announcement posted: School picnic planned for 10th April. Check announcements for details.' },
  ];

  for (let i = 0; i < 10; i++) {
    const user = users[i % users.length];
    const status = msgStatuses[i];
    const type = msgTypes[i];
    const msg = sampleMessages[i];
    const provider = providers[i];

    const sentAt = ['SENT', 'DELIVERED'].includes(status) ? new Date(Date.now() - i * 60000) : null;
    const deliveredAt = status === 'DELIVERED' ? new Date(Date.now() - i * 30000) : null;
    const failReason = status === 'FAILED' ? 'Provider timeout / Number not reachable' : null;

    try {
      await prisma.messageLog.create({
        data: {
          type,
          recipient: type === 'EMAIL' ? (user.email ?? `user${i}@school.edu`) : `+9198765432${i.toString().padStart(2, '0')}`,
          recipientName: `${user.firstName} ${user.lastName}`,
          subject: msg.subject,
          content: msg.content,
          status,
          provider,
          providerRef: status !== 'QUEUED' && status !== 'FAILED' ? `REF${Date.now()}${i}` : null,
          sentAt,
          deliveredAt,
          failReason,
        },
      });
      console.log(`  Created ${type} message [${status}] to ${user.firstName} ${user.lastName} - "${msg.subject}"`);
    } catch (e: any) {
      console.log(`  Skipped: ${e.message}`);
    }
  }

  console.log('Phase 16 seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
