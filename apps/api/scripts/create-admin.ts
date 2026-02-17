
import { prisma, UserRole } from '@antiai/database';
import * as bcrypt from 'bcrypt';

// Prisma instance is already exported from @antiai/database


async function main() {
    const email = 'idjey@icloud.com';
    const password = 'Abc**12345';
    const passwordHash = await bcrypt.hash(password, 12);

    console.log(`Creating/Updating admin user: ${email}`);

    const user = await prisma.user.upsert({
        where: { email },
        update: {
            role: 'admin' as UserRole,
            passwordHash,
        },
        create: {
            email,
            passwordHash,
            role: 'admin' as UserRole,
            isEmailVerified: true,
            subscription: {
                create: {
                    plan: 'free',
                    status: 'active',
                }
            },
            profile: {
                create: {
                    handle: 'idjey_admin',
                    displayName: 'Admin User',
                }
            }
        },
    });

    console.log(`User ${user.email} is now an admin with ID: ${user.id}`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
