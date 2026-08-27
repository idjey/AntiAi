const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email1 = "testlock1@example.com";
  const email2 = "testlock2@example.com";
  
  // create org
  const org = await prisma.organization.create({
    data: {
      name: "Lock Test Org",
      slug: "lock-test-" + Date.now(),
      maxSeats: 5,
    }
  });

  console.log("Created org", org.id);

  async function invite(email) {
    return prisma.$transaction(async (tx) => {
      console.log(`[${email}] Starting tx`);
      
      const orgs = await tx.$queryRaw`SELECT max_seats FROM organizations WHERE id = ${org.id}::uuid FOR UPDATE`;
      console.log(`[${email}] Got lock`);
      
      const memberCount = await tx.teamMember.count({ where: { organizationId: org.id } });
      const pendingCount = await tx.pendingInvite.count({ where: { organizationId: org.id, status: 'PENDING' } });
      console.log(`[${email}] Counts: members=${memberCount}, pending=${pendingCount}`);
      
      if (memberCount + pendingCount + 1 > org.maxSeats) {
         throw new Error("Seat limit reached");
      }
      
      // artificial delay to ensure race condition overlaps
      await new Promise(r => setTimeout(r, 500));
      
      const res = await tx.pendingInvite.create({
        data: {
          organizationId: org.id,
          email,
          role: 'MEMBER',
          status: 'PENDING',
          expiresAt: new Date(Date.now() + 10000)
        }
      });
      console.log(`[${email}] Inserted`);
      return res;
    });
  }

  // Race
  try {
    const p1 = invite(email1);
    const p2 = invite(email2);
    await Promise.all([p1, p2]);
    console.log("Both succeeded!");
  } catch (e) {
    console.error("Error in race:", e.message);
  }
}

main().finally(() => prisma.$disconnect());
