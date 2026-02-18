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
import { format } from 'date-fns'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface LogsTableProps {
    logs: any[]
}

export function LogsTable({ logs }: LogsTableProps) {
    if (!logs || logs.length === 0) {
        return <div className="text-center p-8 text-muted-foreground">No logs found</div>
    }

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Time</TableHead>
                        <TableHead>Event Type</TableHead>
                        <TableHead>Entity</TableHead>
                        <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {logs.map((log) => (
                        <TableRow key={log.id}>
                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                {format(new Date(log.createdAt), 'MMM d, HH:mm:ss')}
                            </TableCell>
                            <TableCell>
                                <Badge variant="outline" className="font-mono">
                                    {log.eventType}
                                </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                                <div className="flex space-x-2">
                                    <span className="font-semibold">{log.entityType}</span>
                                    <span className="font-mono text-xs text-muted-foreground truncate max-w-[150px]" title={log.entityId}>
                                        {log.entityId}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell>
                                {log.data ? (
                                    <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Data
                                            </Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-2xl">
                                            <DialogHeader>
                                                <DialogTitle>Log Details</DialogTitle>
                                                <DialogDescription>
                                                    {log.id}
                                                </DialogDescription>
                                            </DialogHeader>
                                            <div className="bg-slate-950 text-slate-50 p-4 rounded-lg overflow-auto max-h-[400px]">
                                                <pre className="text-xs font-mono">
                                                    {JSON.stringify(log.data, null, 2)}
                                                </pre>
                                            </div>
                                        </DialogContent>
                                    </Dialog>
                                ) : (
                                    <span className="text-muted-foreground text-xs text-center block">-</span>
                                )}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
