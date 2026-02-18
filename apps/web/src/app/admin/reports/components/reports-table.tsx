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
import { ReportActions } from './report-actions'
import { format } from 'date-fns'
import { AlertCircle, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

interface ReportsTableProps {
    reports: any[]
}

export function ReportsTable({ reports }: ReportsTableProps) {
    if (!reports || reports.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No reports found</div>
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'open':
                return <Badge variant="destructive" className="bg-red-600"><AlertCircle className="w-3 h-3 mr-1" /> Open</Badge>
            case 'closed':
                return <Badge variant="secondary"><CheckCircle className="w-3 h-3 mr-1" /> Closed</Badge>
            case 'reviewed':
                return <Badge variant="outline"><CheckCircle className="w-3 h-3 mr-1" /> Reviewed</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const renderEntityLink = (report: any) => {
        if (report.videoId) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Video</span>
                    <Link href={`/admin/videos?search=${report.video?.title || report.videoId}`} className="font-medium hover:underline text-primary">
                        {report.video?.title || 'Unknown Video'}
                    </Link>
                </div>
            )
        }
        if (report.channelId) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Channel</span>
                    <Link href={`/admin/channels?search=${report.channel?.channelName || report.channelId}`} className="font-medium hover:underline text-primary">
                        {report.channel?.channelName || 'Unknown Channel'}
                    </Link>
                </div>
            )
        }
        if (report.proofId) {
            return (
                <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">Proof</span>
                    <Link href={`/admin/proofs?search=${report.proof?.kid || report.proofId}`} className="font-medium hover:underline text-primary">
                        {report.proof?.kid || 'Unknown Proof'}
                    </Link>
                </div>
            )
        }
        return <span className="text-muted-foreground">Unknown Entity</span>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Target</TableHead>
                        <TableHead>Reason</TableHead>
                        <TableHead>Details</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Date</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {reports.map((report) => (
                        <TableRow key={report.id}>
                            <TableCell>
                                {renderEntityLink(report)}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline">{report.reason}</Badge>
                            </TableCell>
                            <TableCell className="max-w-[300px]">
                                <div className="truncate text-sm" title={report.details || ''}>
                                    {report.details || '-'}
                                </div>
                            </TableCell>
                            <TableCell>
                                {getStatusBadge(report.status)}
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                                {format(new Date(report.createdAt), 'MMM d, HH:mm')}
                            </TableCell>
                            <TableCell className="text-right">
                                <ReportActions report={report} />
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
