import { ArrowUpRight, CheckCircle, ShieldCheck, Video } from 'lucide-react'

interface StatsOverviewProps {
    totalChannels: number
    totalVideos: number
    totalProofs: number
    isLoading: boolean
}

export function StatsOverview({ totalChannels, totalVideos, totalProofs, isLoading }: StatsOverviewProps) {
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="card h-32 animate-pulse bg-surface-light/50" />
                ))}
            </div>
        )
    }

    const stats = [
        {
            title: 'Verified Channels',
            value: totalChannels,
            icon: CheckCircle,
            desc: 'Total connected channels',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10'
        },
        {
            title: 'Protected Videos',
            value: totalVideos,
            icon: Video,
            desc: 'Videos with proofs',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10'
        },
        {
            title: 'Proof Checks',
            value: totalProofs,
            icon: ShieldCheck,
            desc: 'Total issued proofs',
            color: 'text-green-500',
            bg: 'bg-green-500/10'
        }
    ]

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {stats.map((stat) => (
                <div key={stat.title} className="card relative overflow-hidden group hover:border-primary/20 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                        <div>
                            <p className="text-text-secondary text-sm font-medium mb-1">{stat.title}</p>
                            <h3 className="text-3xl font-bold">{stat.value}</h3>
                        </div>
                        <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                            <stat.icon className="w-5 h-5" />
                        </div>
                    </div>
                    <div className="flex items-center text-xs text-text-secondary">
                        <span>{stat.desc}</span>
                    </div>

                    {/* Glow effect */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl group-hover:from-primary/10 transition-colors" />
                </div>
            ))}
        </div>
    )
}
