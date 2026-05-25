'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Plus, Settings2, Trash2, Webhook, Database, Activity, RefreshCw } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'

export function LogSinksPanel() {
    const [sinks, setSinks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSink, setEditingSink] = useState<any>(null)

    // Form State
    const [name, setName] = useState('')
    const [type, setType] = useState('webhook')
    const [enabled, setEnabled] = useState(true)
    const [config, setConfig] = useState<any>({})

    const fetchSinks = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/sinks`, {
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })
            if (res.ok) {
                const data = await res.json()
                setSinks(data.data)
            }
        } catch (error) {
            console.error('Failed to fetch sinks', error)
            toast.error('Failed to load integrations')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchSinks()
    }, [])

    const handleSave = async () => {
        if (!name || Object.keys(config).length === 0) {
            toast.error('Please fill out all required fields')
            return
        }

        try {
            const payload = {
                name,
                type,
                enabled,
                config,
                filterMethods: [],
                filterPaths: []
            }

            const url = editingSink 
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/sinks/${editingSink.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/sinks`

            const res = await fetch(url, {
                method: editingSink ? 'PATCH' : 'POST',
                headers: { 
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (res.ok) {
                toast.success(`Integration ${editingSink ? 'updated' : 'created'} successfully`)
                setIsDialogOpen(false)
                fetchSinks()
            } else {
                const err = await res.json()
                toast.error(`Error: ${err.message || 'Failed to save integration'}`)
            }
        } catch (error) {
            console.error(error)
            toast.error('An unexpected error occurred')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this integration?')) return

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/sinks/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            })

            if (res.ok) {
                toast.success('Integration deleted')
                fetchSinks()
            }
        } catch (error) {
            console.error(error)
            toast.error('Failed to delete integration')
        }
    }

    const handleTest = async (id: string) => {
        toast.promise(
            fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/logs/sinks/${id}/test`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            }).then(async (res) => {
                const data = await res.json()
                if (!res.ok || !data.data.success) throw new Error(data.data?.message || 'Test failed')
                return data.data.message
            }),
            {
                loading: 'Testing connection...',
                success: (msg) => msg,
                error: (err) => err.message
            }
        )
    }

    const openDialog = (sink?: any) => {
        if (sink) {
            setEditingSink(sink)
            setName(sink.name)
            setType(sink.type)
            setEnabled(sink.enabled)
            setConfig(sink.config || {})
        } else {
            setEditingSink(null)
            setName('')
            setType('webhook')
            setEnabled(true)
            setConfig({ method: 'POST' })
        }
        setIsDialogOpen(true)
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">External Log Sinks</h2>
                    <p className="text-sm text-muted-foreground">Forward your HTTP logs to external services automatically.</p>
                </div>
                <Button onClick={() => openDialog()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Integration
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {isLoading ? (
                    <p className="text-sm text-muted-foreground">Loading...</p>
                ) : sinks.length === 0 ? (
                    <Card className="col-span-full border-dashed">
                        <CardContent className="flex flex-col items-center justify-center p-12 text-center">
                            <Activity className="w-12 h-12 text-muted-foreground/50 mb-4" />
                            <p className="text-lg font-medium">No Integrations Configured</p>
                            <p className="text-sm text-muted-foreground mb-4">Set up webhooks or databases to receive log data.</p>
                            <Button variant="outline" onClick={() => openDialog()}>Set Up First Integration</Button>
                        </CardContent>
                    </Card>
                ) : sinks.map(sink => (
                    <Card key={sink.id} className={!sink.enabled ? 'opacity-70' : ''}>
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-2">
                                    {sink.type === 'webhook' ? <Webhook className="w-5 h-5 text-blue-500" /> : <Database className="w-5 h-5 text-purple-500" />}
                                    <CardTitle className="text-lg">{sink.name}</CardTitle>
                                </div>
                                <Badge variant={sink.enabled ? (sink.errorCount > 0 ? 'destructive' : 'default') : 'secondary'}>
                                    {sink.enabled ? (sink.errorCount > 0 ? 'Failing' : 'Active') : 'Disabled'}
                                </Badge>
                            </div>
                            <CardDescription className="capitalize">{sink.type}</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm">
                                {sink.errorCount > 0 && (
                                    <div className="text-red-500 mb-2 font-medium">
                                        Failing ({sink.errorCount} retries) - {sink.lastError}
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Last Forwarded:</span>
                                    <span>{sink.lastForwardedAt ? new Date(sink.lastForwardedAt).toLocaleString() : 'Never'}</span>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="w-full" onClick={() => openDialog(sink)}>
                                    <Settings2 className="w-4 h-4 mr-2" />
                                    Configure
                                </Button>
                                <Button variant="outline" size="sm" onClick={() => handleTest(sink.id)}>
                                    <RefreshCw className="w-4 h-4" />
                                </Button>
                                <Button variant="outline" size="sm" className="text-red-500 hover:text-red-600" onClick={() => handleDelete(sink.id)}>
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>{editingSink ? 'Edit Integration' : 'Add Integration'}</DialogTitle>
                        <DialogDescription>
                            Configure a new destination for your HTTP logs.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Integration Name</Label>
                            <Input 
                                placeholder="e.g. Production Datadog Webhook" 
                                value={name} 
                                onChange={e => setName(e.target.value)} 
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Destination Type</Label>
                            <Select value={type} onValueChange={setType} disabled={!!editingSink}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="webhook">Webhook (HTTP POST)</SelectItem>
                                    <SelectItem value="postgresql">PostgreSQL (External DB)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center justify-between border rounded-lg p-3">
                            <div className="space-y-0.5">
                                <Label>Enable Integration</Label>
                                <p className="text-sm text-muted-foreground">Turn on log forwarding for this sink</p>
                            </div>
                            <Switch checked={enabled} onCheckedChange={setEnabled} />
                        </div>

                        <div className="pt-4 border-t">
                            <h3 className="text-sm font-medium mb-4">Configuration</h3>
                            
                            {type === 'webhook' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Webhook URL</Label>
                                        <Input 
                                            placeholder="https://hooks.slack.com/..." 
                                            value={config.url || ''} 
                                            onChange={e => setConfig({...config, url: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>HTTP Method</Label>
                                        <Select value={config.method || 'POST'} onValueChange={(v: string) => setConfig({...config, method: v})}>
                                            <SelectTrigger><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="POST">POST</SelectItem>
                                                <SelectItem value="PUT">PUT</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            )}

                            {type === 'postgresql' && (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Connection String</Label>
                                        <Input 
                                            type={editingSink ? "password" : "text"}
                                            placeholder="postgres://user:pass@host:5432/db" 
                                            value={config.connectionString || ''} 
                                            onChange={e => setConfig({...config, connectionString: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Target Table Name</Label>
                                        <Input 
                                            placeholder="http_logs_archive" 
                                            value={config.tableName || ''} 
                                            onChange={e => setConfig({...config, tableName: e.target.value})} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Schema (Optional)</Label>
                                        <Input 
                                            placeholder="public" 
                                            value={config.schema || 'public'} 
                                            onChange={e => setConfig({...config, schema: e.target.value})} 
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                        <Button onClick={handleSave}>Save Integration</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
