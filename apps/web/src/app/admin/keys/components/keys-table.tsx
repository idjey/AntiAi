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
import { CheckCircle, XCircle, Power, Archive } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface KeysTableProps {
    keys: any[]
}

export function KeysTable({ keys }: KeysTableProps) {
    const router = useRouter()
    const [loadingId, setLoadingId] = useState<string | null>(null)

    const handleAction = async (id: string, action: 'retire' | 'active') => {
        setLoadingId(id)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/keys/${id}/${action}`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })

            if (!res.ok) throw new Error(`Failed to ${action} key`)

            toast.success(`Key ${action}d successfully`)
            router.refresh()
        } catch (error) {
            toast.error(`Failed to ${action} key`)
            console.error(error)
        } finally {
            setLoadingId(null)
        }
    }

    if (!keys || keys.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No keys found</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Key ID</TableHead>
                        <TableHead>Public Key (Preview)</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Proofs</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {keys.map((key) => (
                        <TableRow key={key.id}>
                            <TableCell className="font-mono text-xs">
                                {key.id}
                            </TableCell>
                            <TableCell className="font-mono text-xs text-muted-foreground max-w-[200px]">
                                <div className="truncate" title={key.publicKeyB64}>
                                    {key.publicKeyB64}
                                </div>
                            </TableCell>
                            <TableCell>
                                {key.isActive ? (
                                    <Badge className="bg-green-600 hover:bg-green-700">
                                        <CheckCircle className="w-3 h-3 mr-1" /> Active
                                    </Badge>
                                ) : (
                                    <Badge variant="secondary">
                                        <Archive className="w-3 h-3 mr-1" /> Retired
                                    </Badge>
                                )}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(key.createdAt), 'MMM d, yyyy')}
                            </TableCell>
                            <TableCell>
                                {key._count?.proofs || 0}
                            </TableCell>
                            <TableCell className="text-right">
                                {key.isActive ? (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-orange-500 hover:text-orange-600 hover:bg-orange-500/10"
                                        disabled={loadingId === key.id}
                                        onClick={() => handleAction(key.id, 'retire')}
                                    >
                                        <Archive className="w-4 h-4 mr-2" />
                                        Retire
                                    </Button>
                                ) : (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="text-green-600 hover:text-green-700 hover:bg-green-500/10"
                                        disabled={loadingId === key.id}
                                        onClick={() => handleAction(key.id, 'active')}
                                    >
                                        <Power className="w-4 h-4 mr-2" />
                                        Activate
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
