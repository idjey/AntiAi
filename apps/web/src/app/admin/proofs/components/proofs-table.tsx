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
import { ProofActions } from './proof-actions'
import { format } from 'date-fns'
import { ShieldCheck, AlertTriangle, XCircle, RefreshCcw } from 'lucide-react'

interface ProofsTableProps {
    proofs: any[]
}

export function ProofsTable({ proofs }: ProofsTableProps) {
    if (!proofs || proofs.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No proofs found</div>
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <Badge variant="default" className="bg-green-600"><ShieldCheck className="w-3 h-3 mr-1" /> Active</Badge>
            case 'revoked':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Revoked</Badge>
            case 'expired':
                return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" /> Expired</Badge>
            case 'superseded':
                return <Badge variant="outline"><RefreshCcw className="w-3 h-3 mr-1" /> Superseded</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Video</TableHead>
                        <TableHead>Channel</TableHead>
                        <TableHead>Key ID</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Issued</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {proofs.map((proof) => (
                        <TableRow key={proof.id}>
                            <TableCell className="max-w-[200px]">
                                <div className="font-medium line-clamp-1" title={proof.video?.title}>{proof.video?.title || 'Unknown Video'}</div>
                                <div className="text-xs text-muted-foreground line-clamp-1">{proof.video?.id}</div>
                            </TableCell>
                            <TableCell>
                                <div className="text-sm">{proof.channel?.channelName || 'Unknown'}</div>
                            </TableCell>
                            <TableCell>
                                <code className="text-xs bg-muted px-1 py-0.5 rounded">{proof.kid}</code>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(proof.status)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(proof.issuedAt), 'MMM d, yyyy HH:mm')}
                            </TableCell>
                            <TableCell className="text-right">
                                <ProofActions proof={proof} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
