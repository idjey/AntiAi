'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface LogsExportButtonsProps {
    logs: any[]
    logType?: 'audit' | 'http'
}

export function LogsExportButtons({ logs, logType = 'audit' }: LogsExportButtonsProps) {
    const downloadFile = (content: string, mimeType: string, extension: string) => {
        const blob = new Blob([content], { type: mimeType })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${logType}_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.${extension}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    const handleExport = (formatType: 'csv' | 'json' | 'log') => {
        if (!logs || logs.length === 0) {
            toast.error('No logs to export')
            return
        }

        try {
            if (formatType === 'csv') {
                let headers: string[]
                let rows: string[][]

                if (logType === 'http') {
                    headers = ['Timestamp', 'Method', 'Path', 'Status', 'Duration(ms)', 'IP Address', 'Country', 'Device', 'User Agent', 'User ID', 'Correlation ID']
                    rows = logs.map(log => [
                        log.timestamp || '',
                        log.method || '',
                        log.path || '',
                        String(log.statusCode || ''),
                        String(log.durationMs || ''),
                        log.ipAddress || '',
                        log.country || '',
                        log.device || '',
                        (log.userAgent || '').replace(/"/g, '""'),
                        log.userId || '',
                        log.correlationId || '',
                    ])
                } else {
                    headers = ['ID', 'Created At', 'Event Type', 'Entity Type', 'Entity ID', 'Data']
                    rows = logs.map(log => [
                        log.id,
                        log.createdAt,
                        log.eventType,
                        log.entityType,
                        log.entityId,
                        JSON.stringify(log.data || {}).replace(/"/g, '""'),
                    ])
                }

                const content = [
                    headers.join(','),
                    ...rows.map(row => row.map(val => `"${val}"`).join(','))
                ].join('\n')

                downloadFile(content, 'text/csv', 'csv')
            } else if (formatType === 'json') {
                const content = JSON.stringify(logs, null, 2)
                downloadFile(content, 'application/json', 'json')
            } else if (formatType === 'log') {
                let content: string

                if (logType === 'http') {
                    content = logs.map(log =>
                        `[${log.timestamp}] ${log.method} ${log.path} ${log.statusCode} ${log.durationMs}ms ${log.ipAddress || '-'} "${log.userAgent || '-'}"`
                    ).join('\n')
                } else {
                    content = logs.map(log =>
                        `[${log.createdAt}] ${log.eventType?.toUpperCase()} (${log.entityType}: ${log.entityId})\nData: ${JSON.stringify(log.data, null, 2)}\n`
                    ).join('\n----------------------------------------\n\n')
                }

                downloadFile(content, 'text/plain', 'log')
            }

            toast.success(`Exported as .${formatType}`)
        } catch (error) {
            console.error('Export failed', error)
            toast.error('Failed to export logs')
        }
    }

    return (
        <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => handleExport('csv')}>
                <Download className="w-4 h-4 mr-2" />
                CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('json')}>
                <Download className="w-4 h-4 mr-2" />
                JSON
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleExport('log')}>
                <Download className="w-4 h-4 mr-2" />
                LOG
            </Button>
        </div>
    )
}
