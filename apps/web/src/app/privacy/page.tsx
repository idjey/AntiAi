import Link from 'next/link'

export default function PrivacyPage() {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container-custom max-w-4xl">
                <div className="mb-12">
                    <Link href="/" className="text-primary hover:text-primary-400 text-sm font-medium mb-4 inline-block transition-colors">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Privacy Policy</h1>
                    <p className="text-text-secondary">Effective Date: {currentDate} • Last Updated: {currentDate}</p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-text-secondary">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">1. Introduction</h2>
                        <p className="mb-4">
                            This Privacy Policy explains how antiai.me collects, uses, and protects your information when you use our Service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">2. Information We Collect</h2>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">2.1 Account information</h3>
                        <p className="mb-2">When you create an account, we collect:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Name</li>
                            <li>Email address</li>
                            <li>Login credentials</li>
                            <li>Profile information</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">2.2 Channel and content data</h3>
                        <p className="mb-2">When you verify channels or videos, we collect:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Channel IDs</li>
                            <li>Video IDs</li>
                            <li>Public metadata</li>
                            <li>Proof records</li>
                        </ul>
                        <p className="mb-4 text-primary/80">We do not store the actual video files.</p>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">2.3 Payment information</h3>
                        <p className="mb-2">If you subscribe to a paid plan:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Payment details are processed by third-party providers (e.g., Stripe)</li>
                            <li>We do not store full card numbers</li>
                        </ul>
                        <p className="mb-2">We may store:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Billing status</li>
                            <li>Subscription plan</li>
                            <li>Transaction IDs</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">2.4 Usage and technical data</h3>
                        <p className="mb-2">We may collect:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>IP address</li>
                            <li>Browser type</li>
                            <li>Device type</li>
                            <li>Access times</li>
                            <li>Log data</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">3. How We Use Your Information</h2>
                        <p className="mb-2">We use data to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Provide and operate the Service</li>
                            <li>Verify creators and content</li>
                            <li>Generate authenticity proofs</li>
                            <li>Manage subscriptions</li>
                            <li>Improve platform security</li>
                            <li>Communicate with users</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">4. Public Information</h2>
                        <p className="mb-2">Certain data may be publicly visible on creator pages, including:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Creator handle</li>
                            <li>Channel name</li>
                            <li>Verified videos</li>
                            <li>Official links</li>
                            <li>Verification status</li>
                        </ul>
                        <p className="mb-4">Only information you choose to make public will be displayed.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">5. Sharing of Information</h2>
                        <p className="mb-4">We do not sell your personal data.</p>
                        <p className="mb-2">We may share data with:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Service providers</li>
                            <li>Payment processors</li>
                            <li>Hosting providers</li>
                            <li>Analytics services</li>
                            <li>Legal requirements</li>
                        </ul>
                        <p className="mb-4">We may disclose information if required by law or legal process.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">6. Data Retention</h2>
                        <p className="mb-2">We retain data:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>As long as your account is active</li>
                            <li>As needed to comply with legal obligations</li>
                            <li>As required for fraud prevention and security</li>
                        </ul>
                        <p className="mb-4">You may request deletion of your account at any time.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">7. Security</h2>
                        <p className="mb-2">We implement reasonable security measures, including:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Encrypted connections (HTTPS)</li>
                            <li>Access controls</li>
                            <li>Logging and monitoring</li>
                        </ul>
                        <p className="mb-4">However, no system is 100% secure.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">8. Your Rights</h2>
                        <p className="mb-2">Depending on your location, you may have rights to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Access your data</li>
                            <li>Correct inaccurate data</li>
                            <li>Request deletion</li>
                            <li>Restrict processing</li>
                            <li>Data portability</li>
                        </ul>
                        <p className="mb-4">
                            To exercise these rights, contact us at: <a href="mailto:privacy@antiai.me" className="text-primary hover:text-primary-400 underline">privacy@antiai.me</a>
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">9. Cookies and Tracking</h2>
                        <p className="mb-2">We may use cookies and similar technologies to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Keep you logged in</li>
                            <li>Improve performance</li>
                            <li>Analyze usage</li>
                        </ul>
                        <p className="mb-4">You can control cookies through your browser settings.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">10. Third-Party Links</h2>
                        <p className="mb-2">Creator pages may contain links to third-party websites.</p>
                        <p className="mb-4">We are not responsible for:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Their privacy practices</li>
                            <li>Their content</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">11. Children’s Privacy</h2>
                        <p className="mb-2">The Service is not intended for children under 13.</p>
                        <p className="mb-4">We do not knowingly collect data from children.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">12. International Users</h2>
                        <p className="mb-4">If you access the Service from outside the United States:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Your data may be processed in the U.S.</li>
                            <li>You consent to such transfer by using the Service</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">13. Changes to This Policy</h2>
                        <p className="mb-2">We may update this Privacy Policy from time to time. We will:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Update the “Last Updated” date</li>
                            <li>Notify users of significant changes</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">14. Contact</h2>
                        <p className="mb-4">For privacy-related questions:</p>
                        <p>
                            Email: <a href="mailto:privacy@antiai.me" className="text-primary hover:text-primary-400 underline">privacy@antiai.me</a>
                        </p>
                        <p>
                            Website: <a href="https://antiai.me" className="text-primary hover:text-primary-400 underline">https://antiai.me</a>
                        </p>
                    </section>
                </div>
            </div>
        </div>
    )
}
