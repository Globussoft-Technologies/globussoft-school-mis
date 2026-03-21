const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

async function main() {
  const teacher = await p.user.findFirst({ where: { role: 'CLASS_TEACHER' } });
  const subjectTeacher = await p.user.findFirst({ where: { role: 'SUBJECT_TEACHER' } });

  // Get lesson plans
  const lessonPlans = await p.lessonPlan.findMany({ take: 20, include: { topic: true, chapter: true } });
  console.log(`Found ${lessonPlans.length} lesson plans`);

  if (lessonPlans.length === 0) {
    // Create some lesson plans first
    const syllabi = await p.syllabus.findMany({
      take: 5,
      include: { chapters: { include: { topics: true }, take: 3 } }
    });

    let planCount = 0;
    for (const syl of syllabi) {
      for (const ch of syl.chapters) {
        for (const topic of ch.topics.slice(0, 2)) {
          try {
            await p.lessonPlan.create({
              data: {
                chapterId: ch.id,
                topicId: topic.id,
                teacherId: teacher.id,
                scheduledDate: new Date(`2026-03-${String(10 + planCount).padStart(2, '0')}`),
                objectives: JSON.stringify(['Understand core concepts', 'Apply to problems']),
                methodology: 'Interactive lecture with examples',
                resources: JSON.stringify(['Textbook', 'Whiteboard', 'PPT']),
                status: planCount < 10 ? 'DELIVERED' : planCount < 15 ? 'APPROVED' : 'DRAFT',
              },
            });
            planCount++;
          } catch {}
        }
      }
    }
    console.log(`Created ${planCount} lesson plans`);
  }

  // Now create deliveries for DELIVERED lesson plans
  const deliveredPlans = await p.lessonPlan.findMany({ where: { status: 'DELIVERED' } });
  console.log(`Found ${deliveredPlans.length} delivered lesson plans`);

  let deliveryCount = 0;
  for (const plan of deliveredPlans) {
    try {
      const existing = await p.lessonDelivery.findFirst({ where: { lessonPlanId: plan.id } });
      if (existing) continue;

      await p.lessonDelivery.create({
        data: {
          lessonPlanId: plan.id,
          teacherId: plan.teacherId,
          deliveredAt: plan.scheduledDate,
          duration: 40 + Math.floor(Math.random() * 20),
          topicsCovered: JSON.stringify(['Main concept', 'Examples', 'Practice']),
          methodology: 'Lecture + Discussion',
          studentCount: 18 + Math.floor(Math.random() * 5),
          status: 'COMPLETED',
          rating: 3 + Math.floor(Math.random() * 3),
        },
      });
      deliveryCount++;
    } catch (e) { console.log('  Skip:', e.message?.substring(0, 50)); }
  }
  console.log(`Created ${deliveryCount} lesson deliveries`);

  // Summary
  console.log('\n--- Summary ---');
  console.log('Lesson Plans:', await p.lessonPlan.count());
  console.log('Lesson Deliveries:', await p.lessonDelivery.count());
  console.log('Delivered Plans:', await p.lessonPlan.count({ where: { status: 'DELIVERED' } }));
  console.log('Draft Plans:', await p.lessonPlan.count({ where: { status: 'DRAFT' } }));
  console.log('Approved Plans:', await p.lessonPlan.count({ where: { status: 'APPROVED' } }));
}

main().catch(console.error).finally(() => p.$disconnect());
