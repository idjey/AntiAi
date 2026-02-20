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
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { ExternalLink, CreditCard, MoreHorizontal, Copy, Trash, Ban } from 'lucide-react'
import Link from 'next/link'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

interface BillingTableProps {
    subscriptions: any[]
}

export function BillingTable({ subscriptions }: BillingTableProps) {
    const router = useRouter()

    const handleCancel = async (id: string) => {
        if (!confirm('Are you sure you want to cancel this subscription? This action cannot be undone.')) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/billing/${id}/cancel`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (res.ok) {
                toast.success('Subscription canceled successfully')
                router.refresh()
            } else {
                toast.error('Failed to cancel subscription')
            }
        } catch (error) {
            console.error(error)
            toast.error('An error occurred')
        }
    }

    if (!subscriptions || subscriptions.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No subscriptions found</div>
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge className="bg-green-600">Active</Badge>
            case 'past_due':
                return <Badge variant="destructive">Past Due</Badge>
            case 'canceled':
                return <Badge variant="secondary">Canceled</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getPlanBadge = (plan: string) => {
        switch (plan) {
            case 'elite':
                return <Badge className="bg-purple-600 text-white border-none">Elite</Badge>
            case 'pro':
                return <Badge className="bg-blue-600 text-white border-none">Pro</Badge>
            case 'free':
                return <Badge variant="secondary">Free</Badge>
            default:
                return <Badge variant="outline">{plan}</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>User</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Period End</TableHead>
                        <TableHead>Usage (Videos)</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {subscriptions.map((sub) => (
                        <TableRow key={sub.id}>
                            <TableCell>
                                <div className="font-medium">{sub.user?.email || 'Unknown User'}</div>
                                <div className="text-xs text-muted-foreground">{sub.userId}</div>
                            </TableCell>
                            <TableCell>
                                {getPlanBadge(sub.plan)}
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(sub.status)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {sub.currentPeriodEnd
                                    ? format(new Date(sub.currentPeriodEnd), 'MMM d, yyyy')
                                    : '-'
                                }
                            </TableCell>
                            <TableCell>
                                {sub.videosThisMonth}
                            </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem onClick={() => {
                                            navigator.clipboard.writeText(sub.userId)
                                            toast.success('User ID copied')
                                        }}>
                                            <Copy className="mr-2 h-4 w-4" />
                                            Copy User ID
                                        </DropdownMenuItem>
                                        <DropdownMenuItem asChild={!!sub.stripeCustomerId} disabled={!sub.stripeCustomerId}>
                                            {sub.stripeCustomerId ? (
                                                <Link
                                                    href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    View on Stripe
                                                </Link>
                                            ) : (
                                                <span className="flex items-center cursor-not-allowed opacity-50">
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    View on Stripe (Not Linked)
                                                </span>
                                            )}
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950/20"
                                            onClick={() => handleCancel(sub.id)}
                                            disabled={sub.status === 'canceled'}
                                        >
                                            <Ban className="mr-2 h-4 w-4" />
                                            Cancel Subscription
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
