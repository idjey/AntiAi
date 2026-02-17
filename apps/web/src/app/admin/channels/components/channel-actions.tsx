'use client'

import { useState } from 'react'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, CheckCircle, XCircle, ExternalLink, ShieldCheck, ShieldAlert } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ChannelActionsProps {
    channel: any
}

export function ChannelActions({ channel }: ChannelActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleVerify = async () => {
        if (!confirm('Are you sure you want to verify this channel?')) return

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/channels/${channel.id}/verify`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })

            if (!res.ok) throw new Error('Failed to verify')

            toast.success('Channel verified successfully')
            router.refresh()
        } catch (error) {
            toast.error('Failed to verify channel')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleRevoke = async () => {
        const reason = prompt('Please enter a reason for revocation:')
        if (!reason) return

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/channels/${channel.id}/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ reason })
            })

            if (!res.ok) throw new Error('Failed to revoke')

            toast.success('Channel revoked successfully')
            router.refresh()
        } catch (error) {
            toast.error('Failed to revoke channel')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                    <span className="sr-only">Open menu</span>
                    <MoreHorizontal className="h-4 w-4" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                <DropdownMenuItem
                    onClick={() => navigator.clipboard.writeText(channel.id)}
                >
                    Copy API ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => window.open(`https://youtube.com/channel/${channel.youtube_channel_id}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on YouTube
                </DropdownMenuItem>

                {channel.verification_status !== 'verified' && (
                    <DropdownMenuItem onClick={handleVerify} disabled={isLoading}>
                        <ShieldCheck className="mr-2 h-4 w-4 text-green-500" />
                        Verify Channel
                    </DropdownMenuItem>
                )}

                {channel.verification_status !== 'revoked' && (
                    <DropdownMenuItem onClick={handleRevoke} disabled={isLoading} className="text-red-600 focus:text-red-600">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Revoke Verification
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
