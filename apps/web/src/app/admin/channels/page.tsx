'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Search, Filter } from 'lucide-react'
import { ChannelsTable } from './components/channels-table'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent } from "@/components/ui/card"

export default function AdminChannelsPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State for filtering/searching
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const debouncedSearch = useDebounce(search, 500)

    // Data state
    const [channels, setChannels] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [total, setTotal] = useState(0)
    const [page, setPage] = useState(1)

    // Fetch data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const query = new URLSearchParams()
                if (debouncedSearch) query.set('search', debouncedSearch)
                if (status !== 'all') query.set('status', status)
                query.set('skip', ((page - 1) * 20).toString())
                query.set('take', '20')

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/admin/channels?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    setChannels(data.data)
                    setTotal(data.meta.total)
                }
            } catch (error) {
                console.error('Failed to fetch channels', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [debouncedSearch, status, page])

    // Update URL when filters change
    useEffect(() => {
        const query = new URLSearchParams(searchParams as any)
        if (debouncedSearch) query.set('search', debouncedSearch)
        else query.delete('search')

        if (status !== 'all') query.set('status', status)
        else query.delete('status')

        router.push(`/admin/channels?${query.toString()}`, { scroll: false })
    }, [debouncedSearch, status, router, searchParams])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Channels</h1>
                    <p className="text-muted-foreground">
                        Manage and verify YouTube creator channels
                    </p>
                </div>
                {/* <Button>
                    <Plus className="mr-2 h-4 w-4" /> Add Channel
                </Button> */}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:max-w-xs">
                    <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                    <Input
                        placeholder="Search channels..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>

                <Tabs value={status} onValueChange={setStatus} className="w-full sm:w-auto">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="verified">Verified</TabsTrigger>
                        <TabsTrigger value="revoked">Revoked</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading channels...</div>
                    ) : (
                        <ChannelsTable channels={channels} />
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {channels.length} of {total} channels
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
                        disabled={page * 20 >= total}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    )
}
