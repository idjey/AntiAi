
"use client"

import { useState, useEffect } from "react"
import { formatDistanceToNow } from "date-fns"
import { Check, X, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DiffViewer } from "./diff-viewer"
import { toast } from "sonner"
import { api } from "@/lib/api" // Assuming api helper exists, or use fetch

export function ModerationQueue() {
    const [items, setItems] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [processing, setProcessing] = useState<string | null>(null)

    const fetchQueue = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/moderation/queue?status=PENDING`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (!res.ok) throw new Error('Failed to fetch queue')
            const data = await res.json()
            setItems(data.data || [])
        } catch (error) {
            console.error(error)
            toast.error("Failed to load moderation queue")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchQueue()
    }, [])

    const handleAction = async (id: string, action: 'approve' | 'reject') => {
        setProcessing(id)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/moderation/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify({ reason: action === 'reject' ? 'Admin Rejected' : undefined })
            })

            if (!res.ok) throw new Error('Action failed')

            toast.success(action === 'approve' ? "Approved (Dismissed)" : "Rejected (Reverted)")
            // Remove from list
            setItems(prev => prev.filter(i => i.id !== id))
        } catch (error) {
            toast.error("Failed to process item")
        } finally {
            setProcessing(null)
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
    }

    if (items.length === 0) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/10">
                <Check className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">All caught up!</h3>
                <p className="text-muted-foreground">No pending moderation items.</p>
            </div>
        )
    }

    return (
        <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Target ID</TableHead>
                        <TableHead className="w-[400px]">Changes</TableHead>
                        <TableHead>Submitted</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {items.map((item) => (
                        <TableRow key={item.id}>
                            <TableCell>
                                <Badge variant="outline" className="capitalize">
                                    {item.targetType}
                                </Badge>
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground">
                                {item.targetId.slice(0, 8)}...
                            </TableCell>
                            <TableCell>
                                <div className="space-y-4">
                                    {item.payload?.old && item.payload?.new && Object.keys(item.payload.new).map(key => {
                                        if (item.payload.old[key] !== item.payload.new[key]) {
                                            return (
                                                <DiffViewer
                                                    key={key}
                                                    label={key}
                                                    oldValue={item.payload.old[key]}
                                                    newValue={item.payload.new[key]}
                                                />
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </TableCell>
                            <TableCell className="text-right space-x-2">
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleAction(item.id, 'reject')}
                                    disabled={!!processing}
                                >
                                    {processing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Reject"}
                                </Button>
                                <Button
                                    size="sm"
                                    variant="default"
                                    onClick={() => handleAction(item.id, 'approve')}
                                    disabled={!!processing}
                                >
                                    {processing === item.id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Approve"}
                                </Button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
