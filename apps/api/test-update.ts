import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const profile = await prisma.profile.findUnique({
        where: { handle: 'xxx' }
    });

    if (!profile) {
        console.log("Profile 'xxx' not found.");
        return;
    }

    const appearance = profile.appearance as any || {};

    // Apply our new border settings
    appearance.card_border_style = 'glow';
    appearance.card_border_color = '#10B981';
    appearance.card_border_width = 4;
    appearance.card_border_glow = true;

    await prisma.profile.update({
        where: { handle: 'xxx' },
        data: {
            appearance: appearance
        }
    });

    console.log("Updated profile 'xxx' with test border settings.");
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
