
"use client"

import { SettingsToggles } from "./components/settings-toggles"
import { ImpersonateUser } from "./components/impersonate-user"

export default function AdminSettingsPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Settings & Security</h2>
                <p className="text-muted-foreground">
                    Manage global system configuration and security tools.
                </p>
            </div>

            <div className="grid gap-6">
                <SettingsToggles />
                <ImpersonateUser />
            </div>
        </div>
    )
}
