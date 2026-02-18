'use client'

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'

interface LogsExportButtonsProps {
    logs: any[]
}

export function LogsExportButtons({ logs }: LogsExportButtonsProps) {
    const handleExport = (formatType: 'csv' | 'txt') => {
        if (!logs || logs.length === 0) {
            toast.error('No logs to export')
            return
        }

        try {
            let content = ''
            let mimeType = ''
            let extension = ''

            if (formatType === 'csv') {
                const headers = ['ID', 'Created At', 'Event Type', 'Entity Type', 'Entity ID', 'Data']
                const rows = logs.map(log => [
                    log.id,
                    log.createdAt,
                    log.eventType,
                    log.entityType,
                    log.entityId,
                    JSON.stringify(log.data || {}).replace(/"/g, '""') // Escape quotes
                ])

                content = [
                    headers.join(','),
                    ...rows.map(row => row.map(val => `"${val}"`).join(','))
                ].join('\n')

                mimeType = 'text/csv'
                extension = 'csv'
            } else {
                content = logs.map(log =>
                    `[${log.createdAt}] ${log.eventType.toUpperCase()} (${log.entityType}: ${log.entityId})\nData: ${JSON.stringify(log.data, null, 2)}\n`
                ).join('\n----------------------------------------\n\n')

                mimeType = 'text/plain'
                extension = 'txt'
            }

            const blob = new Blob([content], { type: mimeType })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `system_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.${extension}`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(url)

            toast.success(`Exported as ${formatType.toUpperCase()}`)
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
            <Button variant="outline" size="sm" onClick={() => handleExport('txt')}>
                <Download className="w-4 h-4 mr-2" />
                TXT
            </Button>
        </div>
    )
}
