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
import { MoreHorizontal, ExternalLink, ShieldAlert, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface VideoActionsProps {
    video: any
}

export function VideoActions({ video }: VideoActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleRevokeProofs = async () => {
        const reason = prompt('Please enter a reason for revoking proofs:')
        if (!reason) return

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/videos/${video.id}/revoke-proofs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ reason })
            })

            if (!res.ok) throw new Error('Failed to revoke proofs')

            const data = await res.json()
            toast.success(data.message)
            router.refresh()
        } catch (error) {
            toast.error('Failed to revoke proofs')
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
                    onClick={() => navigator.clipboard.writeText(video.id)}
                >
                    Copy Video ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={() => window.open(`https://youtube.com/watch?v=${video.youtubeVideoId}`, '_blank')}>
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View on YouTube
                </DropdownMenuItem>

                {video.hasActiveProof && (
                    <DropdownMenuItem onClick={handleRevokeProofs} disabled={isLoading} className="text-red-600 focus:text-red-600">
                        <ShieldAlert className="mr-2 h-4 w-4" />
                        Revoke Proofs
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
