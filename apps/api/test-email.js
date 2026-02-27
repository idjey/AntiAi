const nodemailer = require('nodemailer');

async function testPort(port, secure) {
    const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port,
        secure,
        auth: {
            user: 'resend',
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 5000,
    });

    try {
        await transporter.verify();
        console.log(`✅ Port ${port} (secure: ${secure}) is OPEN and verified!`);
    } catch (err) {
        console.error(`❌ Port ${port} (secure: ${secure}) FAILED: ${err.message}`);
    }
}

async function run() {
    await testPort(587, false);
    await testPort(465, true);
    await testPort(2525, false);
    await testPort(2465, true);
}
run();
