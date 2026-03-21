const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findFirst({ where: { email: 'admin@medicaps.edu.in' } })
  .then(u => console.log('User found:', u ? `${u.id} ${u.email}` : 'NOT FOUND'))
  .catch(e => console.log('DB Error:', e.message))
  .finally(() => p.$disconnect());
