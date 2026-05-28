const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findUnique({ where: { email: 'djkanjaria@gmail.com' } });
  console.log(user);
  
  if (user && user.role !== 'admin') {
      console.log('Updating user to admin and unsuspending...');
      await prisma.user.update({
          where: { id: user.id },
          data: {
              role: 'admin',
              isSuspended: false,
              isEmailVerified: true
          }
      });
      console.log('User updated successfully.');
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());
