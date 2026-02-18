'use client'

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { VideoActions } from './video-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'
import { ShieldCheck, AlertTriangle } from 'lucide-react'

interface VideosTableProps {
    videos: any[]
}

export function VideosTable({ videos }: VideosTableProps) {
    if (!videos || videos.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No videos found</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Registered</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {videos.map((video) => (
                        <TableRow key={video.id}>
                            <TableCell className="flex items-center gap-3">
                                <div className="h-10 w-16 bg-muted rounded overflow-hidden relative shrink-0">
                                    {video.thumbnailUrl ? (
                                        <img src={video.thumbnailUrl} alt={video.title} className="object-cover w-full h-full" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-secondary text-xs">No Img</div>
                                    )}
                                </div>
                                <div className="flex flex-col min-w-0 max-w-[200px]">
                                    <span className="font-medium line-clamp-1" title={video.title}>{video.title || 'Untitled'}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        ID: {video.youtubeVideoId}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarImage src={video.channel?.avatarUrl} />
                                        <AvatarFallback>{video.channel?.channelName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm line-clamp-1">{video.channel?.channelName || 'Unknown'}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {video.hasActiveProof ? (
                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                        <ShieldCheck className="w-3 h-3 mr-1" /> Verified
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        Unverified
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell>
                                <div className="text-xs space-y-1">
                                    <div>Proofs: {video._count?.proofs || 0}</div>
                                    <div className={video._count?.reports > 0 ? "text-red-500 font-medium" : ""}>
                                        Reports: {video._count?.reports || 0}
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(video.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <VideoActions video={video} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
