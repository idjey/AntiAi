'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { LogsExportButtons } from './logs-export-buttons'
import { WorldMap } from './world-map'
import { useDebounce } from '@/hooks/use-debounce'
import { format } from 'date-fns'
import {
    Activity,
    Clock,
    AlertTriangle,
    Globe,
    Search,
    RefreshCw,
    Wifi,
} from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'

// --- Helpers ---

function getMethodColor(method: string) {
    switch (method?.toUpperCase()) {
        case 'GET': return 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400'
        case 'POST': return 'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400'
        case 'PUT': return 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
        case 'PATCH': return 'bg-purple-500/15 text-purple-600 border-purple-500/30 dark:text-purple-400'
        case 'DELETE': return 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400'
        default: return ''
    }
}

function getStatusColor(status: number) {
    if (status >= 200 && status < 300) return 'bg-green-500/15 text-green-600 border-green-500/30 dark:text-green-400'
    if (status >= 300 && status < 400) return 'bg-blue-500/15 text-blue-600 border-blue-500/30 dark:text-blue-400'
    if (status >= 400 && status < 500) return 'bg-amber-500/15 text-amber-600 border-amber-500/30 dark:text-amber-400'
    if (status >= 500) return 'bg-red-500/15 text-red-600 border-red-500/30 dark:text-red-400'
    return ''
}

function getDurationColor(ms: number) {
    if (ms < 100) return 'text-green-600 dark:text-green-400'
    if (ms < 500) return 'text-yellow-600 dark:text-yellow-400'
    if (ms < 1000) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400 font-bold'
}

function capitalize(str: string) {
    if (!str) return '-'
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

interface HttpLog {
    id: string
    method: string
    path: string
    routePattern?: string
    queryString?: string
    requestContentLength?: number
    statusCode: number
    responseContentLength?: number
    durationMs: number
    errorMessage?: string
    ipAddress: string
    userAgent?: string
    origin?: string
    referer?: string
    userId?: string
    country?: string
    city?: string
    device?: string
    correlationId?: string
    timestamp: string
}

interface HttpStats {
    totalRequests24h: number
    avgDurationMs24h: number
    errorRate24h: number
    uniqueIps24h: number
}

// --- Stats Card ---

function StatCard({ icon: Icon, label, value, gradient, valueClassName, onClick, isClickable }: {
    icon: React.ElementType
    label: string
    value: string | number
    gradient: string
    valueClassName?: string
    onClick?: () => void
    isClickable?: boolean
}) {
    return (
        <Card 
            className={`bg-gradient-to-br ${gradient} border-0 ${isClickable ? 'cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all' : ''}`}
            onClick={onClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground">{label}</p>
                        <p className={`text-2xl font-bold tracking-tight mt-1 ${valueClassName || ''}`}>{value}</p>
                    </div>
                    <div className="rounded-full bg-background/50 p-2.5">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

// --- Main Component ---

export function HttpLogsPanel() {
    // Filters
    const [method, setMethod] = useState('')
    const [statusFilter, setStatusFilter] = useState('')
    const [path, setPath] = useState('')
    const [minDuration, setMinDuration] = useState('')
    const [sortBy, setSortBy] = useState('time')
    const [sortOrder, setSortOrder] = useState('desc')
    const [device, setDevice] = useState('')
    const [country, setCountry] = useState('')

    const debouncedPath = useDebounce(path, 500)
    const debouncedMinDuration = useDebounce(minDuration, 500)
    const debouncedCountry = useDebounce(country, 500)

    // Data
    const [logs, setLogs] = useState<HttpLog[]>([])
    const [stats, setStats] = useState<HttpStats | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // Detail dialog
    const [selectedLog, setSelectedLog] = useState<HttpLog | null>(null)

    // Map dialog
    const [isMapOpen, setIsMapOpen] = useState(false)
    const [mapData, setMapData] = useState<any[]>([])
    const [isMapLoading, setIsMapLoading] = useState(false)

    // Auto-refresh
    const [autoRefresh, setAutoRefresh] = useState(false)
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortBy(column)
            setSortOrder('desc')
        }
        setPage(1)
    }

    const SortIcon = ({ column }: { column: string }) => {
        const isActive = sortBy === column
        const isAsc = isActive && sortOrder === 'asc'
        const isDesc = isActive && sortOrder === 'desc'
        return (
            <span className="ml-1 inline-flex items-center text-xs font-bold font-mono">
                <span className={isAsc ? 'text-primary' : 'text-muted-foreground/30'}>↑</span>
                <span className={isDesc ? 'text-primary' : 'text-muted-foreground/30'}>↓</span>
            </span>
        )
    }

    const fetchLogs = useCallback(async () => {
        try {
            const query = new URLSearchParams()
            query.set('skip', ((page - 1) * 50).toString())
            query.set('take', '50')
            if (method) query.set('method', method)
            if (statusFilter) query.set('statusGroup', statusFilter)
            if (debouncedPath) query.set('path', debouncedPath)
            if (debouncedMinDuration) query.set('minDuration', debouncedMinDuration)
            if (sortBy) query.set('sortBy', sortBy)
            if (sortOrder) query.set('sortOrder', sortOrder)
            if (device) query.set('device', device)
            if (debouncedCountry) query.set('country', debouncedCountry)

            const res = await fetch(`${API_URL}/admin/logs/http?${query.toString()}`, {
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
            console.error('Failed to fetch HTTP logs', error)
        }
    }, [page, method, statusFilter, debouncedPath, debouncedMinDuration, sortBy, sortOrder, device, debouncedCountry])

    const fetchStats = useCallback(async () => {
        try {
            const res = await fetch(`${API_URL}/admin/logs/http/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch HTTP stats', error)
        }
    }, [])

    const fetchMapData = useCallback(async () => {
        setIsMapLoading(true)
        try {
            const res = await fetch(`${API_URL}/admin/logs/http/map-data`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })
            if (res.ok) {
                const data = await res.json()
                setMapData(data)
            }
        } catch (error) {
            console.error('Failed to fetch Map Data', error)
        } finally {
            setIsMapLoading(false)
        }
    }, [])

    // Initial + filter-driven fetch
    useEffect(() => {
        const load = async () => {
            setIsLoading(true)
            await Promise.all([fetchLogs(), fetchStats()])
            setIsLoading(false)
        }
        load()
    }, [fetchLogs, fetchStats])

    // Auto-refresh interval
    useEffect(() => {
        if (autoRefresh) {
            intervalRef.current = setInterval(() => {
                fetchLogs()
                fetchStats()
            }, 30000)
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current)
                intervalRef.current = null
            }
        }
    }, [autoRefresh, fetchLogs, fetchStats])

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">HTTP Logs</h1>
                    <p className="text-muted-foreground">
                        Request and response monitoring
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={autoRefresh ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAutoRefresh(v => !v)}
                        className="gap-2"
                    >
                        {autoRefresh ? (
                            <>
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                                </span>
                                Live
                            </>
                        ) : (
                            <>
                                <Wifi className="h-4 w-4" />
                                Auto-refresh
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { fetchLogs(); fetchStats() }}
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                    <LogsExportButtons logs={logs} logType="http" />
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Activity}
                    label="Total Requests (24h)"
                    value={stats?.totalRequests24h?.toLocaleString() ?? '—'}
                    gradient="from-blue-500/5 to-cyan-500/5"
                />
                <StatCard
                    icon={Clock}
                    label="Avg Response Time"
                    value={stats ? `${Math.round(stats.avgDurationMs24h)}ms` : '—'}
                    gradient="from-violet-500/5 to-purple-500/5"
                />
                <StatCard
                    icon={AlertTriangle}
                    label="Error Rate"
                    value={stats ? `${stats.errorRate24h.toFixed(1)}%` : '—'}
                    gradient="from-orange-500/5 to-red-500/5"
                    valueClassName={stats && stats.errorRate24h > 5 ? 'text-red-600 dark:text-red-400' : ''}
                />
                <StatCard
                    icon={Globe}
                    label="Unique IPs"
                    value={stats?.uniqueIps24h?.toLocaleString() ?? '—'}
                    gradient="from-emerald-500/5 to-teal-500/5"
                    isClickable={true}
                    onClick={() => {
                        setIsMapOpen(true)
                        fetchMapData()
                    }}
                />
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select
                    value={method}
                    onChange={e => { setMethod(e.target.value); setPage(1) }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="">All Methods</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                </select>

                <select
                    value={statusFilter}
                    onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="">All Statuses</option>
                    <option value="2xx">2xx Success</option>
                    <option value="3xx">3xx Redirect</option>
                    <option value="4xx">4xx Client Error</option>
                    <option value="5xx">5xx Server Error</option>
                </select>

                <div className="relative w-full sm:max-w-xs">
                    <Search className="h-4 w-4 text-muted-foreground absolute left-3 top-3" />
                    <Input
                        placeholder="Filter by path..."
                        className="pl-9"
                        value={path}
                        onChange={e => { setPath(e.target.value); setPage(1) }}
                    />
                </div>

                <Input
                    type="number"
                    placeholder="Min ms"
                    className="max-w-[120px]"
                    value={minDuration}
                    onChange={e => { setMinDuration(e.target.value); setPage(1) }}
                />
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 items-center">
                <select
                    value={device}
                    onChange={e => { setDevice(e.target.value); setPage(1) }}
                    className="h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                    <option value="">All Devices</option>
                    <option value="desktop">Desktop</option>
                    <option value="mobile">Mobile</option>
                    <option value="tablet">Tablet</option>
                    <option value="bot">Bot</option>
                </select>

                <Input
                    type="text"
                    placeholder="Country Code (e.g. US)"
                    className="max-w-[150px]"
                    value={country}
                    onChange={e => { setCountry(e.target.value); setPage(1) }}
                />
            </div>

            {/* Table */}
            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading HTTP logs...</div>
                    ) : !logs || logs.length === 0 ? (
                        <div className="text-center p-8 text-muted-foreground">No HTTP logs found</div>
                    ) : (
                        <div className="rounded-md border">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('time')}><div className="flex items-center">Time <SortIcon column="time" /></div></TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('method')}><div className="flex items-center">Method <SortIcon column="method" /></div></TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('path')}><div className="flex items-center">Path <SortIcon column="path" /></div></TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('status')}><div className="flex items-center">Status <SortIcon column="status" /></div></TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('duration')}><div className="flex items-center justify-end">Duration <SortIcon column="duration" /></div></TableHead>
                                        <TableHead>IP Address</TableHead>
                                        <TableHead className="cursor-pointer hover:bg-muted/50 select-none" onClick={() => handleSort('country')}><div className="flex items-center">Location <SortIcon column="country" /></div></TableHead>
                                        <TableHead>Device</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {logs.map((log) => (
                                        <TableRow
                                            key={log.id}
                                            className="cursor-pointer"
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            <TableCell className="whitespace-nowrap font-mono text-xs text-muted-foreground">
                                                {log.timestamp ? (() => {
                                                    try {
                                                        return format(new Date(log.timestamp), 'MMM d, HH:mm:ss')
                                                    } catch {
                                                        return String(log.timestamp)
                                                    }
                                                })() : 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={`font-mono ${getMethodColor(log.method)}`}>
                                                    {log.method}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="font-mono text-xs max-w-[200px] truncate" title={log.path}>
                                                {log.path}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={getStatusColor(log.statusCode)}>
                                                    {log.statusCode}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className={`text-right font-mono text-xs ${getDurationColor(log.durationMs)}`}>
                                                {log.durationMs}ms
                                            </TableCell>
                                            <TableCell className="font-mono text-xs max-w-[120px] truncate" title={log.ipAddress}>
                                                {log.ipAddress || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs max-w-[150px] truncate" title={log.city ? `${log.city}, ${log.country}` : log.country}>
                                                {log.city ? `${log.city}, ` : ''}{log.country || '-'}
                                            </TableCell>
                                            <TableCell className="text-xs">
                                                {capitalize(log.device || '')}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
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

            {/* Detail Dialog */}
            <Dialog open={!!selectedLog} onOpenChange={open => { if (!open) setSelectedLog(null) }}>
                <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Badge variant="outline" className={`font-mono ${getMethodColor(selectedLog?.method || '')}`}>
                                {selectedLog?.method}
                            </Badge>
                            <span className="font-mono text-sm">{selectedLog?.path}</span>
                        </DialogTitle>
                        <DialogDescription>
                            {selectedLog?.id}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedLog && (
                        <div className="space-y-5">
                            {/* Request Info */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Request Info</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailField label="Method" value={selectedLog.method} />
                                    <DetailField label="Path" value={selectedLog.path} mono />
                                    <DetailField label="Origin" value={selectedLog.origin} mono />
                                    <DetailField label="Referer" value={selectedLog.referer} mono />
                                </div>
                            </div>

                            {/* Response Info */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Response Info</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailField label="Status Code">
                                        <Badge variant="outline" className={getStatusColor(selectedLog.statusCode)}>
                                            {selectedLog.statusCode}
                                        </Badge>
                                    </DetailField>
                                    <DetailField label="Duration">
                                        <span className={getDurationColor(selectedLog.durationMs)}>
                                            {selectedLog.durationMs}ms
                                        </span>
                                    </DetailField>
                                    {selectedLog.errorMessage && (
                                        <div className="col-span-2">
                                            <DetailField label="Error Message" value={selectedLog.errorMessage} />
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Client Info */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Client Info</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailField label="IP Address" value={selectedLog.ipAddress} mono />
                                    <DetailField label="User ID" value={selectedLog.userId} mono />
                                    <div className="col-span-2">
                                        <DetailField label="User Agent" value={selectedLog.userAgent} mono />
                                    </div>
                                </div>
                            </div>

                            {/* Geo & Device */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Geo &amp; Device</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailField label="Location" value={selectedLog.city ? `${selectedLog.city}, ${selectedLog.country}` : selectedLog.country} />
                                    <DetailField label="Device" value={capitalize(selectedLog.device || '')} />
                                </div>
                            </div>

                            {/* Tracing */}
                            <div>
                                <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Tracing</h4>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <DetailField label="Correlation ID" value={selectedLog.correlationId} mono />
                                    <DetailField label="Timestamp" value={
                                        selectedLog.timestamp
                                            ? (() => { try { return format(new Date(selectedLog.timestamp), 'PPpp') } catch { return selectedLog.timestamp } })()
                                            : undefined
                                    } mono />
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Map Dialog */}
            <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
                <DialogContent className="max-w-4xl border-[#1E293B] bg-[#0B0F14] text-white">
                    <DialogHeader>
                        <DialogTitle className="text-xl">Traffic Origins (Last 24h)</DialogTitle>
                        <DialogDescription className="text-slate-400">
                            Geographical distribution of unique IP addresses accessing the platform.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-4">
                        {isMapLoading ? (
                            <div className="flex h-[500px] items-center justify-center border border-white/10 rounded-lg bg-[#0f172a]/50">
                                <span className="relative flex h-4 w-4 mr-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500" />
                                </span>
                                <span className="text-slate-400">Resolving geolocation data...</span>
                            </div>
                        ) : mapData.length === 0 ? (
                            <div className="flex h-[500px] items-center justify-center border border-white/10 rounded-lg">
                                <span className="text-slate-500">No geographic data available.</span>
                            </div>
                        ) : (
                            <WorldMap data={mapData} />
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// --- Detail Field ---

function DetailField({ label, value, mono, children }: {
    label: string
    value?: string | null
    mono?: boolean
    children?: React.ReactNode
}) {
    return (
        <div>
            <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
            {children || (
                <p className={`${mono ? 'font-mono text-xs' : ''} break-all`}>
                    {value || <span className="text-muted-foreground">-</span>}
                </p>
            )}
        </div>
    )
}
