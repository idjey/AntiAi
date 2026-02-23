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
import { MoreHorizontal, Ban, CheckCircle, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface ReportActionsProps {
    report: any
}

export function ReportActions({ report }: ReportActionsProps) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)

    const handleResolve = async (action: 'dismiss' | 'revoke_proof' | 'suspend_user') => {
        let reason = ''
        if (action !== 'dismiss') {
            reason = prompt('Please enter a reason/note for this action:') || ''
            if (!reason) return // Require reason for harsh actions
        }

        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/reports/${report.id}/resolve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ action, reason })
            })

            if (!res.ok) throw new Error('Failed to resolve report')

            toast.success('Report resolved successfully')
            router.refresh()
        } catch (error) {
            toast.error('Failed to resolve report')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    if (report.status !== 'open') {
        return null
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
                <DropdownMenuLabel>Resolution Actions</DropdownMenuLabel>

                <DropdownMenuItem onClick={() => handleResolve('dismiss')} disabled={isLoading}>
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                    Dismiss (Mark False)
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                {report.proofId && (
                    <DropdownMenuItem onClick={() => handleResolve('revoke_proof')} disabled={isLoading} className="text-red-600 focus:text-red-600">
                        <XCircle className="mr-2 h-4 w-4" />
                        Revoke Proof
                    </DropdownMenuItem>
                )}

                <DropdownMenuItem onClick={() => handleResolve('suspend_user')} disabled={isLoading} className="text-red-600 focus:text-red-600">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend User
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
