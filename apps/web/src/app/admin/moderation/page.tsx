
"use client"

import { ModerationQueue } from "./components/moderation-queue"

export default function AdminModerationPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Content Moderation</h2>
                <p className="text-muted-foreground">
                    Review and moderate user content updates.
                </p>
            </div>

            <ModerationQueue />
        </div>
    )
}
