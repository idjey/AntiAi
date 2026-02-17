try {
    console.log('Attempting to require @prisma/client...');
    const prisma = require('@prisma/client');
    console.log('Success:', prisma);
} catch (e) {
    console.error('Failed:', e);
}
