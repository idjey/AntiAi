'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { LogsTable } from './components/logs-table'
import { LogsExportButtons } from './components/logs-export-buttons'
import { HttpLogsPanel } from './components/http-logs-panel'
import { useDebounce } from '@/hooks/use-debounce'

export default function AdminLogsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    const activeTab = searchParams.get('tab') || 'audit'

    // Audit Logs State
    const [eventType, setEventType] = useState(searchParams.get('eventType') || '')
    const [entityType, setEntityType] = useState(searchParams.get('entityType') || '')

    // Debounce filters to avoid too many requests
    const debouncedEventType = useDebounce(eventType, 500)
    const debouncedEntityType = useDebounce(entityType, 500)

    const [logs, setLogs] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // Fetch data
    useEffect(() => {
        if (activeTab !== 'audit') return

        const fetchData = async () => {
            setIsLoading(true)
            try {
                const query = new URLSearchParams()
                if (debouncedEventType) query.set('eventType', debouncedEventType)
                if (debouncedEntityType) query.set('entityType', debouncedEntityType)

                query.set('skip', ((page - 1) * 50).toString())
                query.set('take', '50')

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    setLogs(data.data)
                    setTotal(data.meta.total)
                }
            } catch (error) {
                console.error('Failed to fetch logs', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [debouncedEventType, debouncedEntityType, page, activeTab])

    // Update URL
    useEffect(() => {
        const query = new URLSearchParams(searchParams as any)

        if (debouncedEventType) query.set('eventType', debouncedEventType)
        else query.delete('eventType')

        if (debouncedEntityType) query.set('entityType', debouncedEntityType)
        else query.delete('entityType')

        router.push(`/admin/logs?${query.toString()}`, { scroll: false })
    }, [debouncedEventType, debouncedEntityType, router, searchParams])

    const handleTabChange = (value: string) => {
        const query = new URLSearchParams()
        query.set('tab', value)
        router.push(`/admin/logs?${query.toString()}`, { scroll: false })
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        {activeTab === 'http' ? 'HTTP Logs' : 'System Logs'}
                    </h1>
                    <p className="text-muted-foreground">
                        {activeTab === 'http'
                            ? 'Request and response monitoring'
                            : 'Audit trail and transparency logs'
                        }
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange}>
                <TabsList>
                    <TabsTrigger value="audit">Audit Logs</TabsTrigger>
                    <TabsTrigger value="http">HTTP Logs</TabsTrigger>
                </TabsList>

                <TabsContent value="audit">
                    <div className="space-y-6">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex flex-col sm:flex-row gap-4 items-center">
                                <Input
                                    placeholder="Filter by Event Type..."
                                    className="max-w-xs"
                                    value={eventType}
                                    onChange={(e) => setEventType(e.target.value)}
                                />
                                <Input
                                    placeholder="Filter by Entity Type..."
                                    className="max-w-xs"
                                    value={entityType}
                                    onChange={(e) => setEntityType(e.target.value)}
                                />
                            </div>
                            <LogsExportButtons logs={logs} logType="audit" />
                        </div>

                        <Card>
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-8 text-center text-muted-foreground">Loading logs...</div>
                                ) : (
                                    <LogsTable logs={logs} />
                                )}
                            </CardContent>
                        </Card>

                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                            <div>
                                Showing {logs.length} of {total} logs
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    Previous
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={page * 50 >= total}
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="http">
                    <HttpLogsPanel />
                </TabsContent>
            </Tabs>
        </div>
    )
}
