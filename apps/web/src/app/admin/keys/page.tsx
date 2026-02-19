'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from "@/components/ui/card"
import { KeysTable } from './components/keys-table'
import { CreateKeyDialog } from './components/create-key-dialog'

export default function AdminKeysPage() {
    const [keys, setKeys] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchKeys = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/keys`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            })

            if (res.ok) {
                const data = await res.json()
                setKeys(data)
            }
        } catch (error) {
            console.error('Failed to fetch keys', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchKeys()
    }, [])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Signing Keys</h1>
                    <p className="text-muted-foreground">
                        Manage Ed25519 cryptographic keys for verifying content
                    </p>
                </div>
                <CreateKeyDialog />
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading keys...</div>
                    ) : (
                        <KeysTable keys={keys} />
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
