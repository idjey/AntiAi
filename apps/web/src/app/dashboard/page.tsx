import Link from 'next/link'

export default function DashboardPage() {
    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                <p className="text-text-secondary">Welcome back to your creator command center.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Stat Cards */}
                <div className="card">
                    <h3 className="text-text-secondary text-sm font-medium mb-2">Verified Videos</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white">0</span>
                        <span className="text-primary text-sm font-medium mb-1">+0 this week</span>
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-text-secondary text-sm font-medium mb-2">Total Views Protected</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white">0</span>
                        <span className="text-primary text-sm font-medium mb-1">0% growth</span>
                    </div>
                </div>
                <div className="card">
                    <h3 className="text-text-secondary text-sm font-medium mb-2">Proof Checks</h3>
                    <div className="flex items-end gap-2">
                        <span className="text-3xl font-bold text-white">0</span>
                        <span className="text-text-secondary text-sm font-medium mb-1">Last 30 days</span>
                    </div>
                </div>
            </div>

            {/* Action Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="card p-8 border-dashed border-2 border-white/10 flex flex-col items-center justify-center text-center min-h-[300px]">
                    <div className="w-16 h-16 rounded-full bg-surface-light flex items-center justify-center mb-4">
                        <svg className="w-8 h-8 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold mb-2">Add your first channel</h3>
                    <p className="text-text-secondary mb-6 max-w-sm">
                        Verify ownership of your YouTube channel to start generating cryptographic proofs for your videos.
                    </p>
                    <Link href="/dashboard/channels/add" className="btn-primary">
                        Connect Channel
                    </Link>
                </div>

                <div className="card">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold">Recent Activity</h3>
                        <button className="text-sm text-primary hover:text-primary-400">View all</button>
                    </div>
                    <div className="space-y-4">
                        <div className="text-center py-12 text-text-secondary">
                            No activity yet
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
