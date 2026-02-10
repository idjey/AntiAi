import Link from 'next/link'

export default function CookiesPage() {
    const currentDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: '2-digit' });

    return (
        <div className="min-h-screen bg-background pt-24 pb-16">
            <div className="container-custom max-w-4xl">
                <div className="mb-12">
                    <Link href="/" className="text-primary hover:text-primary-400 text-sm font-medium mb-4 inline-block transition-colors">
                        ← Back to Home
                    </Link>
                    <h1 className="text-4xl md:text-5xl font-bold mb-4">Cookies Policy</h1>
                    <p className="text-text-secondary">Effective Date: {currentDate} • Last Updated: {currentDate}</p>
                </div>

                <div className="prose prose-invert prose-lg max-w-none text-text-secondary">
                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">1. Introduction</h2>
                        <p className="mb-4">
                            This Cookies Policy explains how antiai.me (“antiai”, “we”, “us”, or “our”) uses cookies and similar technologies when you visit our website, applications, and services (collectively, the “Service”).
                        </p>
                        <p className="mb-4">
                            By using the Service, you agree to the use of cookies as described in this policy, subject to your preferences where applicable.
                        </p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">2. What Are Cookies</h2>
                        <p className="mb-2">
                            Cookies are small text files stored on your device when you visit a website.
                        </p>
                        <p className="mb-2">They help websites:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Recognize your device</li>
                            <li>Remember your preferences</li>
                            <li>Improve performance and security</li>
                            <li>Provide analytics and functionality</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">3. Types of Cookies We Use</h2>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">3.1 Essential Cookies (Required)</h3>
                        <p className="mb-2">These cookies are necessary for the Service to function properly.</p>
                        <p className="mb-2">They are used for:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-2">
                            <li>Authentication and login sessions</li>
                            <li>Security and fraud prevention</li>
                            <li>Basic site functionality</li>
                            <li>Load balancing and performance</li>
                        </ul>
                        <p className="mb-2">Without these cookies, the Service cannot operate correctly.</p>
                        <p className="mb-4 text-sm text-text-muted">Examples: Session cookies, Authentication tokens, Security-related cookies</p>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">3.2 Functional Cookies</h3>
                        <p className="mb-2">These cookies allow the site to remember choices you make.</p>
                        <p className="mb-2">They may be used to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Remember language or region</li>
                            <li>Store dashboard preferences</li>
                            <li>Improve user experience</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">3.3 Analytics Cookies</h3>
                        <p className="mb-2">These cookies help us understand how users interact with the Service.</p>
                        <p className="mb-2">They may collect:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-2">
                            <li>Pages visited</li>
                            <li>Time spent on pages</li>
                            <li>Device and browser types</li>
                            <li>Referral sources</li>
                        </ul>
                        <p className="mb-2">We use this information to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Improve the product</li>
                            <li>Fix usability issues</li>
                            <li>Optimize performance</li>
                        </ul>

                        <h3 className="text-xl font-semibold text-text-primary mb-2">3.4 Third-Party Cookies</h3>
                        <p className="mb-2">Some cookies may be set by trusted third-party providers, such as:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-2">
                            <li>Payment processors</li>
                            <li>Analytics providers</li>
                            <li>Hosting and infrastructure services</li>
                        </ul>
                        <p className="mb-4">These third parties have their own privacy and cookie policies.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">4. How We Use Cookies</h2>
                        <p className="mb-2">We use cookies to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Keep you logged in</li>
                            <li>Protect accounts from unauthorized access</li>
                            <li>Remember your preferences</li>
                            <li>Analyze platform usage</li>
                            <li>Improve performance and reliability</li>
                        </ul>
                        <p className="mb-2">We do not use cookies to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Sell personal data</li>
                            <li>Track you across unrelated third-party sites</li>
                            <li>Build advertising profiles</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">5. Cookie Consent</h2>
                        <p className="mb-2">When you first visit antiai.me, you may see a cookie consent banner.</p>
                        <p className="mb-2">Depending on your location, you may:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-2">
                            <li>Accept all cookies</li>
                            <li>Reject non-essential cookies</li>
                            <li>Customize your preferences</li>
                        </ul>
                        <p className="mb-4">Essential cookies are always enabled because they are required for the Service to function.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">6. Managing Cookies</h2>
                        <p className="mb-2">You can control cookies in several ways:</p>

                        <h4 className="font-semibold text-text-primary mt-4 mb-2">Through our consent banner</h4>
                        <p className="mb-2">You can:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Accept or reject optional cookies</li>
                            <li>Change preferences at any time</li>
                        </ul>

                        <h4 className="font-semibold text-text-primary mt-4 mb-2">Through your browser settings</h4>
                        <p className="mb-2">Most browsers allow you to:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>Block cookies</li>
                            <li>Delete cookies</li>
                            <li>Receive alerts before cookies are stored</li>
                        </ul>
                        <p className="mb-4 text-amber-400/90">Disabling essential cookies may cause parts of the Service to stop working.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">7. Data Retention</h2>
                        <p className="mb-2">Cookies may be stored:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>For the duration of your session, or</li>
                            <li>For a defined period depending on the cookie type</li>
                        </ul>
                        <p className="mb-4">Analytics cookies are typically retained for a limited time.</p>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">8. Changes to This Policy</h2>
                        <p className="mb-2">We may update this Cookies Policy from time to time. When we do:</p>
                        <ul className="list-disc pl-6 space-y-2 mb-4">
                            <li>We will update the “Last Updated” date</li>
                            <li>Significant changes may be communicated through the Service</li>
                        </ul>
                    </section>

                    <section className="mb-12">
                        <h2 className="text-2xl font-bold text-text-primary mb-4">9. Contact</h2>
                        <p className="mb-4">If you have questions about this Cookies Policy:</p>
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
