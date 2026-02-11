import Link from 'next/link'
import { ArrowRight, ShieldCheck, Clock } from 'lucide-react'

interface ActivityItem {
    id: string
    title: string
    channelName: string
    date: string
    status: 'verified' | 'pending'
}

interface RecentActivityProps {
    activities: ActivityItem[]
    isLoading: boolean
}

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
    if (isLoading) {
        return (
            <div className="card h-full min-h-[300px] animate-pulse">
                <div className="h-6 w-32 bg-surface-light rounded mb-6" />
                <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-16 bg-surface-light rounded" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="card h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg">Recent Protected Videos</h3>
                <Link href="/dashboard/videos" className="text-sm text-primary hover:text-primary-400 flex items-center gap-1 transition-colors">
                    View all <ArrowRight className="w-4 h-4" />
                </Link>
            </div>

            <div className="flex-1">
                {activities.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center py-8 text-text-secondary">
                        <div className="w-12 h-12 rounded-full bg-surface-light flex items-center justify-center mb-3">
                            <Clock className="w-6 h-6 opacity-50" />
                        </div>
                        <p>No verified videos yet</p>
                        <p className="text-sm mt-1">Import a video to see activity</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {activities.map((item) => (
                            <div key={item.id} className="group flex items-center gap-3 p-3 rounded-lg hover:bg-surface-light/50 transition-colors">
                                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
                                    <ShieldCheck className="w-5 h-5" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h4>
                                    <div className="flex items-center gap-2 text-xs text-text-secondary">
                                        <span className="truncate max-w-[120px]">{item.channelName}</span>
                                        <span>•</span>
                                        <span>{new Date(item.date).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <div className="px-2 py-1 rounded text-xs font-medium bg-green-500/10 text-green-500 border border-green-500/20">
                                    Verified
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
