'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search } from 'lucide-react'
import { BillingTable } from './components/billing-table'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent } from "@/components/ui/card"

export default function AdminBillingPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State
    const [status, setStatus] = useState(searchParams.get('status') || 'all')
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const debouncedSearch = useDebounce(search, 500)

    const [subscriptions, setSubscriptions] = useState([])
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
                if (status && status !== 'all') query.set('status', status)

                query.set('skip', ((page - 1) * 20).toString())
                query.set('take', '20')

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/billing?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    setSubscriptions(data.data)
                    setTotal(data.meta.total)
                }
            } catch (error) {
                console.error('Failed to fetch subscriptions', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [debouncedSearch, status, page])

    // Update URL
    useEffect(() => {
        const query = new URLSearchParams(searchParams as any)
        if (debouncedSearch) query.set('search', debouncedSearch)
        else query.delete('search')

        if (status && status !== 'all') query.set('status', status)
        else query.delete('status')

        router.push(`/admin/billing?${query.toString()}`, { scroll: false })
    }, [debouncedSearch, status, router, searchParams])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Subscriptions</h1>
                    <p className="text-muted-foreground">
                        Monitor user subscriptions and Stripe integration
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:max-w-xs">
                    <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                    <Input
                        placeholder="Search by email..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Tabs defaultValue="all" value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="past_due">Past Due</TabsTrigger>
                    <TabsTrigger value="canceled">Canceled</TabsTrigger>
                    <TabsTrigger value="trialing">Trialing</TabsTrigger>
                </TabsList>

                <TabsContent value={status} className="mt-4">
                    <Card>
                        <CardContent className="p-0">
                            {isLoading ? (
                                <div className="p-8 text-center text-muted-foreground">Loading subscriptions...</div>
                            ) : (
                                <BillingTable subscriptions={subscriptions} />
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {subscriptions.length} of {total} subscriptions
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
