'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useDebounce } from '@/hooks/use-debounce'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

export function AuthLogsPanel() {
    const [logs, setLogs] = useState<any[]>([])
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // Filters
    const [status, setStatus] = useState<string>('all')
    const [action, setAction] = useState<string>('all')
    const [ipAddress, setIpAddress] = useState<string>('')
    const debouncedIp = useDebounce(ipAddress, 500)

    useEffect(() => {
        fetchStats()
    }, [])

    useEffect(() => {
        fetchLogs()
    }, [page, status, action, debouncedIp])

    const fetchStats = async () => {
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/auth/stats`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const data = await res.json()
                setStats(data)
            }
        } catch (error) {
            console.error('Failed to fetch auth stats', error)
        }
    }

    const fetchLogs = async () => {
        setIsLoading(true)
        try {
            const query = new URLSearchParams()
            query.set('skip', ((page - 1) * 50).toString())
            query.set('take', '50')
            if (status && status !== 'all') query.set('status', status)
            if (action && action !== 'all') query.set('action', action)
            if (debouncedIp) query.set('ipAddress', debouncedIp)

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/auth?${query.toString()}`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const data = await res.json()
                setLogs(data.data)
                setTotal(data.meta.total)
            }
        } catch (error) {
            console.error('Failed to fetch auth logs', error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Total Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.total_logs?.toLocaleString() || '-'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Recent Logs (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.recent_logs?.toLocaleString() || '-'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Unique Users (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats?.unique_users_30d?.toLocaleString() || '-'}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="py-4">
                        <CardTitle className="text-sm font-medium text-muted-foreground text-red-500">Failed Attempts (30d)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-500">{stats?.failed_attempts_30d?.toLocaleString() || '-'}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
                <Select value={action} onValueChange={(val) => { setAction(val); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Action" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Actions</SelectItem>
                        <SelectItem value="login">Login</SelectItem>
                        <SelectItem value="2fa_verify">2FA Verify</SelectItem>
                        <SelectItem value="2fa_enable">2FA Enable</SelectItem>
                        <SelectItem value="2fa_disable">2FA Disable</SelectItem>
                        <SelectItem value="password_reset">Password Reset</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={status} onValueChange={(val) => { setStatus(val); setPage(1); }}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="success">Success</SelectItem>
                        <SelectItem value="failure">Failure</SelectItem>
                        <SelectItem value="blocked">Blocked</SelectItem>
                    </SelectContent>
                </Select>

                <Input
                    placeholder="Filter by IP..."
                    className="max-w-xs"
                    value={ipAddress}
                    onChange={(e) => { setIpAddress(e.target.value); setPage(1); }}
                />
            </div>

            {/* Logs Table */}
            <Card>
                <CardContent className="p-0">
                    <div className="relative w-full overflow-auto">
                        <table className="w-full caption-bottom text-sm">
                            <thead className="[&_tr]:border-b">
                                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Timestamp</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Action</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Status</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">IP Address</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Location</th>
                                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Device</th>
                                </tr>
                            </thead>
                            <tbody className="[&_tr:last-child]:border-0">
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading auth logs...</td>
                                    </tr>
                                ) : logs.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-8 text-center text-muted-foreground">No auth logs found.</td>
                                    </tr>
                                ) : (
                                    logs.map((log) => (
                                        <tr key={log.id} className="border-b transition-colors hover:bg-muted/50">
                                            <td className="p-4 align-middle font-mono text-xs text-muted-foreground whitespace-nowrap">
                                                {new Date(log.createdAt).toLocaleString()}
                                            </td>
                                            <td className="p-4 align-middle">
                                                {log.user ? (
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">@{log.user.profile?.handle || 'unknown'}</span>
                                                        <span className="text-xs text-muted-foreground">{log.user.email}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-muted-foreground">-</span>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle font-medium capitalize">
                                                {log.action.replace('_', ' ')}
                                            </td>
                                            <td className="p-4 align-middle">
                                                <Badge variant={
                                                    log.status === 'success' ? 'default' :
                                                    log.status === 'failure' ? 'destructive' : 'secondary'
                                                }>
                                                    {log.status}
                                                </Badge>
                                                {log.reason && (
                                                    <div className="text-xs text-muted-foreground mt-1 max-w-[200px] truncate" title={log.reason}>
                                                        {log.reason}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="p-4 align-middle font-mono text-xs">
                                                {log.ipAddress || '-'}
                                            </td>
                                            <td className="p-4 align-middle text-xs">
                                                {log.location || '-'}
                                            </td>
                                            <td className="p-4 align-middle text-xs max-w-[200px] truncate" title={log.userAgent}>
                                                {log.userAgent || '-'}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>Showing {logs.length} of {total} logs</div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>Previous</Button>
                    <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page * 50 >= total}>Next</Button>
                </div>
            </div>
        </div>
    )
}
