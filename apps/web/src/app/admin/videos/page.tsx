'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { VideosTable } from './components/videos-table'
import { useDebounce } from '@/hooks/use-debounce'
import { Card, CardContent } from "@/components/ui/card"

export default function AdminVideosPage() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // State for filtering/searching
    const [search, setSearch] = useState(searchParams.get('search') || '')
    const debouncedSearch = useDebounce(search, 500)

    // Data state
    const [videos, setVideos] = useState([])
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
                query.set('skip', ((page - 1) * 20).toString())
                query.set('take', '20')

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/videos?${query.toString()}`, {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    }
                })

                if (res.ok) {
                    const data = await res.json()
                    setVideos(data.data)
                    setTotal(data.meta.total)
                }
            } catch (error) {
                console.error('Failed to fetch videos', error)
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [debouncedSearch, page])

    // Update URL when filters change
    useEffect(() => {
        const query = new URLSearchParams(searchParams as any)
        if (debouncedSearch) query.set('search', debouncedSearch)
        else query.delete('search')

        router.push(`/admin/videos?${query.toString()}`, { scroll: false })
    }, [debouncedSearch, router, searchParams])

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
                    <p className="text-muted-foreground">
                        Manage registered videos and verify authenticity
                    </p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                <div className="flex items-center gap-2 w-full sm:max-w-xs">
                    <Search className="h-4 w-4 text-muted-foreground absolute ml-3" />
                    <Input
                        placeholder="Search videos..."
                        className="pl-9"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            <Card>
                <CardContent className="p-0">
                    {isLoading ? (
                        <div className="p-8 text-center text-muted-foreground">Loading videos...</div>
                    ) : (
                        <VideosTable videos={videos} />
                    )}
                </CardContent>
            </Card>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div>
                    Showing {videos.length} of {total} videos
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
