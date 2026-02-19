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
import { MoreHorizontal, FileJson, ShieldAlert, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ProofActionsProps {
    proof: any
}

export function ProofActions({ proof }: ProofActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleRevoke = async () => {
        const reason = prompt('Please enter a reason for revoking this proof:')
        if (!reason) return

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/proofs/${proof.id}/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reason })
            })

            if (!res.ok) throw new Error('Failed to revoke proof')

            toast.success('Proof revoked successfully')
            router.refresh()
        } catch (error) {
            toast.error('Failed to revoke proof')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const onViewPayload = () => {
        // Simple alert for MVP, or could be a modal
        alert(JSON.stringify(proof.payloadJson, null, 2))
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
                <DropdownMenuItem onClick={() => navigator.clipboard.writeText(proof.id)}>
                    Copy Proof ID
                </DropdownMenuItem>
                <DropdownMenuSeparator />

                <DropdownMenuItem onClick={onViewPayload}>
                    <FileJson className="mr-2 h-4 w-4" />
                    View Payload
                </DropdownMenuItem>

                {proof.status === 'active' && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleRevoke} disabled={isLoading} className="text-red-600 focus:text-red-600">
                            <ShieldAlert className="mr-2 h-4 w-4" />
                            Revoke Proof
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
