
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface SystemSettings {
    maintenance_mode: boolean
    disable_signups: boolean
    disable_proofs: boolean
}

export function SettingsToggles() {
    // In a real app, fetch these from API. For now, defaulting to false or loading.
    // We'll add useEffect to fetch initial state.
    const [settings, setSettings] = useState<SystemSettings>({
        maintenance_mode: false,
        disable_signups: false,
        disable_proofs: false
    })
    const [loading, setLoading] = useState(true)

    // Mock fetch for now, replace with actual SWR or useEffect fetch
    useState(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                const newSettings: any = {}
                data.forEach((s: any) => newSettings[s.key] = s.value === 'true')
                setSettings(prev => ({ ...prev, ...newSettings }))
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false))
    })

    const handleToggle = async (key: keyof SystemSettings, checked: boolean) => {
        const oldValue = settings[key]
        setSettings(prev => ({ ...prev, [key]: checked })) // Optimistic update

        try {
            const res = await fetch(`/api/admin/settings/${key}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ value: String(checked) })
            })
            if (!res.ok) throw new Error('Failed to update')
            toast.success(`Setting updated: ${key}`)
        } catch (error) {
            setSettings(prev => ({ ...prev, [key]: oldValue })) // Revert
            toast.error("Failed to update setting")
        }
    }

    if (loading) {
        return <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>System Controls</CardTitle>
                <CardDescription>
                    Manage global system availability and feature flags.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="maintenance_mode">Maintenance Mode</Label>
                        <p className="text-sm text-muted-foreground">
                            Disables all non-admin API access.
                        </p>
                    </div>
                    <Switch
                        id="maintenance_mode"
                        checked={settings.maintenance_mode}
                        onCheckedChange={(c) => handleToggle('maintenance_mode', c)}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="disable_signups">Disable Signups</Label>
                        <p className="text-sm text-muted-foreground">
                            Prevents new users from registering.
                        </p>
                    </div>
                    <Switch
                        id="disable_signups"
                        checked={settings.disable_signups}
                        onCheckedChange={(c) => handleToggle('disable_signups', c)}
                    />
                </div>
                <div className="flex items-center justify-between space-x-2">
                    <div className="space-y-1">
                        <Label htmlFor="disable_proofs">Disable Proofs</Label>
                        <p className="text-sm text-muted-foreground">
                            Prevents users from issuing new proofs.
                        </p>
                    </div>
                    <Switch
                        id="disable_proofs"
                        checked={settings.disable_proofs}
                        onCheckedChange={(c) => handleToggle('disable_proofs', c)}
                    />
                </div>
            </CardContent>
        </Card>
    )
}
