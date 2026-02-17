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
import { ChannelActions } from './channel-actions'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { format } from 'date-fns'

interface ChannelsTableProps {
    channels: any[]
}

export function ChannelsTable({ channels }: ChannelsTableProps) {
    if (!channels || channels.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No channels found</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Channel</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Stats</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {channels.map((channel) => (
                        <TableRow key={channel.id}>
                            <TableCell className="flex items-center gap-3">
                                <Avatar className="h-9 w-9">
                                    <AvatarImage src={channel.avatarUrl} alt={channel.channelName} />
                                    <AvatarFallback>{channel.channelName?.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col">
                                    <span className="font-medium line-clamp-1">{channel.channelName}</span>
                                    <span className="text-xs text-muted-foreground line-clamp-1">
                                        {channel.channelHandle || channel.youtubeChannelId}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex flex-col">
                                    <span className="text-sm">{channel.user?.profile?.displayName || 'Unknown'}</span>
                                    <span className="text-xs text-muted-foreground">{channel.user?.email}</span>
                                </div>
                            </TableCell>
                            <TableCell>
                                <Badge variant={
                                    channel.verificationStatus === 'verified' ? 'default' :
                                        channel.verificationStatus === 'revoked' ? 'destructive' : 'secondary'
                                }>
                                    {channel.verificationStatus}
                                </Badge>
                            </TableCell>
                            <TableCell className="capitalize">{channel.verificationMethod || 'N/A'}</TableCell>
                            <TableCell>
                                <div className="text-xs space-y-1">
                                    <div>Videos: {channel._count?.videos || 0}</div>
                                    <div>Proofs: {channel._count?.proofs || 0}</div>
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(channel.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell className="text-right">
                                <ChannelActions channel={channel} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
