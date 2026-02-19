
"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Ghost, LogIn } from "lucide-react"

export function ImpersonateUser() {
    const [userId, setUserId] = useState("")
    const [loading, setLoading] = useState(false)

    const handleImpersonate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!userId) return

        setLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/users/${userId}/impersonate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId })
            })

            if (!res.ok) {
                const error = await res.json()
                throw new Error(error.message || 'Failed to impersonate')
            }

            const data = await res.json()

            // Store admin token to restore later
            const adminToken = localStorage.getItem('token')
            if (adminToken) {
                localStorage.setItem('adminParams', JSON.stringify({ token: adminToken, returnUrl: window.location.href }))
            }

            // Set new token and reload/redirect
            localStorage.setItem('token', data.token)
            toast.success("Ghost Mode Activated", {
                description: `Impersonating user ${userId}`
            })

            // Redirect to home as that user
            window.location.href = '/'

        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="border-red-200 bg-red-50/10">
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Ghost className="h-5 w-5 text-red-500" />
                    <CardTitle>Ghost Mode</CardTitle>
                </div>
                <CardDescription>
                    Impersonate any user. You will be logged in as them immediately.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleImpersonate} className="flex gap-4 items-end">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="userId">User ID</Label>
                        <Input
                            id="userId"
                            placeholder="uuid-of-target-user"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                        />
                    </div>
                    <Button type="submit" variant="destructive" disabled={loading}>
                        {loading ? <span className="animate-spin mr-2">⏳</span> : <LogIn className="mr-2 h-4 w-4" />}
                        Impersonate
                    </Button>
                </form>
            </CardContent>
        </Card>
    )
}
