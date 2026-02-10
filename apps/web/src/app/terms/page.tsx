import Link from 'next/link'

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container-custom max-w-4xl">
                <div className="mb-12">
                    <Link href="/" className="text-primary hover:text-primary-400 text-sm font-medium mb-4 inline-block transition-colors">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Terms of Service</h1>
                    <p className="text-text-secondary">Effective Date: Feb 09, 2026 • Last Updated: Feb 09, 2026</p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-text-secondary">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">1. Introduction</h2>
                        <p className="mb-4">
                            Welcome to antiai.me (“antiai”, “we”, “us”, or “our”).
                            These Terms of Service (“Terms”) govern your access to and use of the antiai.me website, applications, APIs, browser extensions, and related services (collectively, the “Service”).
                        </p>
                        <p>
                            By accessing or using the Service, you agree to be bound by these Terms.
                            If you do not agree, you must not use the Service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">2. Description of the Service</h2>
                        <p className="mb-4">antiai.me provides a platform that allows creators to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Verify ownership of online channels or accounts</li>
                            <li>Generate cryptographic authenticity proofs for content</li>
                            <li>Publish verified creator profiles</li>
                            <li>Provide authenticity indicators to viewers via public pages or extensions</li>
                        </ul>
                        <p>
                            The Service is intended to help creators and audiences distinguish authentic content from impersonations or deepfakes.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">3. Eligibility</h2>
                        <p className="mb-4">You may use the Service only if:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>You are at least 13 years old (or the minimum legal age in your jurisdiction)</li>
                            <li>You have the legal capacity to enter into these Terms</li>
                            <li>You are not prohibited from using the Service under applicable law</li>
                        </ul>
                        <p>
                            If you use the Service on behalf of a company or organization, you represent that you have authority to bind that entity to these Terms.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">4. Account Registration</h2>
                        <p className="mb-4">To use certain features, you must create an account. You agree to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Provide accurate and complete information</li>
                            <li>Keep your login credentials secure</li>
                            <li>Notify us immediately of unauthorized use</li>
                        </ul>
                        <p>
                            You are responsible for all activities under your account.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">5. Creator Verification and Proofs</h2>
                        <p className="mb-4">antiai.me allows creators to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Verify control of a channel or account</li>
                            <li>Generate authenticity proofs for videos or content</li>
                        </ul>
                        <p className="mb-4">You represent and warrant that:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>You own or are authorized to control any account or channel you verify</li>
                            <li>All content submitted for verification is legitimate and lawful</li>
                        </ul>
                        <p className="mb-4">antiai.me does not guarantee:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>That a verified video is free from manipulation</li>
                            <li>That the creator is the legal owner of all intellectual property in the content</li>
                        </ul>
                        <p>
                            The Service provides technical authenticity indicators, not legal certification.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">6. Acceptable Use</h2>
                        <p className="mb-4">You agree not to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Impersonate another person or creator</li>
                            <li>Attempt to verify channels you do not control</li>
                            <li>Upload or verify illegal or infringing content</li>
                            <li>Abuse, scrape, or reverse-engineer the Service</li>
                            <li>Interfere with the platform’s security or integrity</li>
                        </ul>
                        <p>
                            We may suspend or terminate accounts that violate these rules.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">7. Subscription Plans and Billing</h2>
                        <p className="mb-4">antiai.me offers free and paid subscription plans.</p>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">Paid Plans</h3>
                        <p className="mb-2">Paid plans may include:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Additional video verifications</li>
                            <li>Analytics</li>
                            <li>Team features</li>
                            <li>API access</li>
                        </ul>
                        <p className="mb-2">By subscribing to a paid plan:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>You authorize recurring billing</li>
                            <li>Fees are charged in advance on a monthly or annual basis</li>
                            <li>Payments are non-refundable unless required by law</li>
                        </ul>
                        <p>
                            We may change pricing with reasonable notice.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">8. Intellectual Property</h2>
                        <h3 className="text-xl font-semibold text-text-primary mb-2">Our property</h3>
                        <p className="mb-2">All rights, title, and interest in the Service, including:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Software</li>
                            <li>Design</li>
                            <li>Logos</li>
                            <li>Trademarks</li>
                            <li>Documentation</li>
                        </ul>
                        <p className="mb-4">remain the property of antiai.me.</p>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">Your content</h3>
                        <p className="mb-4">You retain ownership of any content you submit. By using the Service, you grant us a limited license to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Process your content</li>
                            <li>Generate proofs</li>
                            <li>Display verified information on public creator pages</li>
                        </ul>
                        <p>
                            This license is solely for operating the Service.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">9. Public Creator Pages</h2>
                        <p className="mb-4">If you create a public creator page:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Certain information will be visible to the public (Channel name, Verified videos, Official links, Verification status)</li>
                            <li>You are responsible for the accuracy of public information</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">10. Service Availability</h2>
                        <p className="mb-4">We strive to keep the Service available, but we do not guarantee:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Continuous uptime</li>
                            <li>Error-free operation</li>
                            <li>Permanent availability of any feature</li>
                        </ul>
                        <p>
                            We may modify or discontinue parts of the Service at any time.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">11. Disclaimer of Warranties</h2>
                        <p className="mb-4">The Service is provided “as is” and “as available.” To the fullest extent permitted by law, we disclaim:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>All warranties</li>
                            <li>Any guarantee of accuracy</li>
                            <li>Any guarantee of security or authenticity beyond the technical proof system</li>
                        </ul>
                        <p className="mb-4">We do not guarantee that:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>The Service will prevent deepfakes</li>
                            <li>The Service will eliminate impersonation</li>
                            <li>The verification system is immune to misuse</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">12. Limitation of Liability</h2>
                        <p className="mb-4">To the maximum extent permitted by law, antiai.me and its affiliates shall not be liable for:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Indirect damages</li>
                            <li>Loss of revenue or data</li>
                            <li>Reputational harm</li>
                            <li>Third-party misuse of the Service</li>
                        </ul>
                        <p>
                            Total liability shall not exceed the amount you paid to antiai.me in the previous 12 months.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">13. Indemnification</h2>
                        <p className="mb-4">You agree to indemnify and hold harmless antiai.me from any claims arising from:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Your use of the Service</li>
                            <li>Your content</li>
                            <li>Your violation of these Terms</li>
                            <li>Your impersonation or misuse of verification tools</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">14. Termination</h2>
                        <p className="mb-4">We may suspend or terminate your account if:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>You violate these Terms</li>
                            <li>You misuse the platform</li>
                            <li>Required by law</li>
                        </ul>
                        <p>
                            You may terminate your account at any time.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">15. Governing Law</h2>
                        <p className="mb-4">
                            These Terms are governed by the laws of Florida, USA without regard to conflict-of-law principles.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">16. Changes to These Terms</h2>
                        <p className="mb-4">
                            We may update these Terms from time to time. If we make material changes:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>We will update the “Last Updated” date</li>
                            <li>We may notify users via email or dashboard notice</li>
                        </ul>
                        <p>
                            Continued use of the Service means you accept the changes.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">17. Contact</h2>
                        <p className="mb-4">For questions about these Terms:</p>
                        <p>
                            Email: <a href="mailto:legal@antiai.me" className="text-primary hover:text-primary-400 underline">legal@antiai.me</a>
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
