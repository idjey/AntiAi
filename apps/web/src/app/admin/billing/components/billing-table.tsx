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
import { ExternalLink, CreditCard } from 'lucide-react'
import Link from 'next/link'

interface BillingTableProps {
    subscriptions: any[]
}

export function BillingTable({ subscriptions }: BillingTableProps) {
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
                                {sub.stripeCustomerId && (
                                    <Button asChild variant="ghost" size="sm">
                                        <Link
                                            href={`https://dashboard.stripe.com/customers/${sub.stripeCustomerId}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                        >
                                            <ExternalLink className="w-4 h-4 mr-2" />
                                            Stripe
                                        </Link>
                                    </Button>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
