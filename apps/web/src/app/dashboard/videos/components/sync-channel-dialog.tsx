'use client'

import { useState } from 'react'

interface SyncChannelDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    userPlan?: string | null
}

interface PreviewVideo {
    videoId: string
    title: string
    thumbnailUrl: string
    publishedAt?: string
}

type Step = 'input' | 'selection' | 'executing' | 'success' | 'upgrade'

export function SyncChannelDialog({ isOpen, onClose, onSuccess, userPlan }: SyncChannelDialogProps) {
    const [step, setStep] = useState<Step>('input')
    const [identifier, setIdentifier] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    // Selection state
    const [previewVideos, setPreviewVideos] = useState<PreviewVideo[]>([])
    const [selectedVideoIds, setSelectedVideoIds] = useState<Set<string>>(new Set())

    // Success state
    const [successMessage, setSuccessMessage] = useState('')

    if (!isOpen) return null

    // If not elite, trap them
    if (userPlan && userPlan !== 'elite' && step !== 'upgrade') {
        setStep('upgrade')
    }

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier.trim()) return

        setIsLoading(true)
        setError('')

        try {
            const token = localStorage.getItem('token')
            if (!token) throw new Error('You must be logged in')

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/videos/sync-channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    channelIdOrHandle: identifier.trim(),
                    dryRun: true
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to sync channel')
            }

            if (data.videos && data.videos.length > 0) {
                setPreviewVideos(data.videos)
                // Auto-select up to 100 videos by default
                const initialSelection = new Set(data.videos.slice(0, 100).map((v: any) => v.videoId))
                setSelectedVideoIds(initialSelection as Set<string>)
                setStep('selection')
            } else {
                setError('No new unprotected videos found on this channel. You may have synced them all already.')
            }
        } catch (err: any) {
            console.error('Search error:', err)
            setError(err.message || 'An unexpected error occurred.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleExecute = async () => {
        if (selectedVideoIds.size === 0) {
            setError('Please select at least one video to verify.')
            return
        }
        if (selectedVideoIds.size > 100) {
            setError('You can only sync up to 100 videos at a time.')
            return
        }

        setStep('executing')
        setError('')

        try {
            const token = localStorage.getItem('token')
            if (!token) throw new Error('You must be logged in')

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/videos/sync-channel`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    channelIdOrHandle: identifier.trim(),
                    dryRun: false,
                    selectedVideoIds: Array.from(selectedVideoIds)
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to sync channel')
            }

            setSuccessMessage(data.message || `Successfully synced ${selectedVideoIds.size} videos!`)
            setStep('success')

            setTimeout(() => {
                onSuccess()
                handleClose()
            }, 3000)

        } catch (err: any) {
            console.error('Execute error:', err)
            setError(err.message || 'An unexpected error occurred during sync.')
            setStep('selection')
        }
    }

    const handleClose = () => {
        setStep('input')
        setIdentifier('')
        setError('')
        setSuccessMessage('')
        setPreviewVideos([])
        setSelectedVideoIds(new Set())
        onClose()
    }

    const toggleVideoSelection = (videoId: string) => {
        const next = new Set(selectedVideoIds)
        if (next.has(videoId)) {
            next.delete(videoId)
        } else {
            if (next.size >= 100) {
                setError('Maximum of 100 videos can be verified at once to prevent server timeout.')
                return
            }
            setError('')
            next.add(videoId)
        }
        setSelectedVideoIds(next)
    }

    const handleSelectAll = () => {
        if (selectedVideoIds.size === previewVideos.length || selectedVideoIds.size === 100) {
            // Deselect all
            setSelectedVideoIds(new Set())
            setError('')
        } else {
            // Select up to 100
            const next = new Set<string>()
            for (let i = 0; i < Math.min(previewVideos.length, 100); i++) {
                next.add(previewVideos[i].videoId)
            }
            setSelectedVideoIds(next)
            setError('')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

                {/* Header */}
                <div className="p-6 shrink-0 border-b border-white/5">
                    <div className="flex justify-between items-start">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">Elite Channel Sync</h2>
                                <p className="text-xs text-text-secondary">Bulk import & protect past videos</p>
                            </div>
                        </div>
                        {step !== 'executing' && (
                            <button onClick={handleClose} className="p-2 text-text-secondary hover:text-white transition-colors" disabled={isLoading}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>
                </div>

                {/* Body Content */}
                <div className="p-6 overflow-y-auto">
                    {step === 'upgrade' && (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                                </svg>
                            </div>
                            <h3 className="text-2xl font-bold text-white mb-2">Upgrade to Elite</h3>
                            <p className="text-text-secondary mb-8">
                                Bulk channel synchronization is an exclusive feature for our Elite creators. Upgrade today to securely verify up to 100 videos with a single click.
                            </p>
                            <div className="flex justify-center gap-4">
                                <button onClick={handleClose} className="px-5 py-2 font-medium text-text-secondary hover:text-white transition-colors">
                                    Cancel
                                </button>
                                <a href="/dashboard/settings" className="px-5 py-2 rounded-lg font-medium text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:opacity-90 transition-opacity">
                                    View Plans
                                </a>
                            </div>
                        </div>
                    )}

                    {step === 'input' && (
                        <form onSubmit={handleSearch}>
                            <div className="mb-6">
                                <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                                    Enter your YouTube channel handle (e.g. <strong>@MrBeast</strong>). We will grab a preview list of all your untested videos for you to select and verify.
                                </p>
                                <label className="block text-sm font-medium text-text-secondary mb-2">
                                    Channel Handle or ID
                                </label>
                                <input
                                    type="text"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    placeholder="e.g. @username or UC..."
                                    className="w-full bg-[#2A2A2A] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/30 focus:outline-none focus:border-yellow-500/50 focus:ring-1 focus:ring-yellow-500/50 transition-all"
                                    disabled={isLoading}
                                    required
                                />
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    type="button"
                                    onClick={handleClose}
                                    className="px-4 py-2 font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
                                    disabled={isLoading}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={!identifier.trim() || isLoading}
                                    className="px-5 py-2 rounded-lg font-medium text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                                >
                                    {isLoading ? (
                                        <>
                                            <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                            Searching...
                                        </>
                                    ) : (
                                        <>Find Videos</>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {step === 'selection' && (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                            <div className="flex justify-between items-center mb-4">
                                <p className="text-sm text-text-secondary">
                                    Found <strong>{previewVideos.length}</strong> new videos. Select up to 100 to verify.
                                </p>
                                <button
                                    onClick={handleSelectAll}
                                    className="text-sm font-medium text-yellow-500 hover:text-yellow-400 transition-colors"
                                >
                                    {selectedVideoIds.size === Math.min(previewVideos.length, 100) ? 'Deselect All' : 'Select Top 100'}
                                </button>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                                    <svg className="w-5 h-5 text-red-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-sm text-red-200">{error}</p>
                                </div>
                            )}

                            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {previewVideos.map((video) => (
                                    <label
                                        key={video.videoId}
                                        className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all ${selectedVideoIds.has(video.videoId)
                                            ? 'bg-yellow-500/10 border-yellow-500/50'
                                            : 'bg-[#2A2A2A] border-white/5 hover:border-white/20'
                                            } ${(selectedVideoIds.size >= 100 && !selectedVideoIds.has(video.videoId)) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <div className="relative flex items-center justify-center">
                                            <input
                                                type="checkbox"
                                                className="w-5 h-5 rounded border-white/20 text-yellow-500 focus:ring-yellow-500/50 bg-[#1A1A1A] transition-all cursor-pointer disabled:cursor-not-allowed"
                                                checked={selectedVideoIds.has(video.videoId)}
                                                onChange={() => toggleVideoSelection(video.videoId)}
                                                disabled={selectedVideoIds.size >= 100 && !selectedVideoIds.has(video.videoId)}
                                            />
                                        </div>
                                        <div className="w-24 aspect-video bg-[#1A1A1A] rounded overflow-hidden shrink-0">
                                            <img
                                                src={video.thumbnailUrl || '/placeholder-video.jpg'}
                                                alt={video.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxeCIgaGVpZ2h0PSIxeCIgdmlld0JveD0iMCAwIDEgMSI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0iIzMzMyIgLz48L3N2Zz4='
                                                }}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="font-medium text-white line-clamp-2 text-sm leading-tight tracking-wide mb-1.5">{video.title}</h4>
                                            {video.publishedAt && (
                                                <p className="text-xs text-text-secondary">{new Date(video.publishedAt).toLocaleDateString()}</p>
                                            )}
                                        </div>
                                    </label>
                                ))}
                            </div>

                            <div className="flex justify-between items-center mt-6 pt-4 border-t border-white/5">
                                <span className={`text-sm font-medium ${selectedVideoIds.size === 100 ? 'text-yellow-500' : 'text-text-secondary'}`}>
                                    Selected: {selectedVideoIds.size} / 100 max limit
                                </span>
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setStep('input')}
                                        className="px-4 py-2 font-medium text-text-secondary hover:text-white transition-colors"
                                    >
                                        Back
                                    </button>
                                    <button
                                        onClick={handleExecute}
                                        disabled={selectedVideoIds.size === 0}
                                        className="px-5 py-2 rounded-lg font-medium text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-yellow-500/20"
                                    >
                                        Verify Selected
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'executing' && (
                        <div className="text-center py-10 animate-in fade-in zoom-in-95 duration-500">
                            {/* Animated Database Icon */}
                            <div className="relative w-24 h-24 mx-auto mb-8">
                                <div className="absolute inset-0 border-4 border-yellow-500/20 rounded-full animate-ping duration-1000" />
                                <div className="absolute inset-2 bg-[#1A1A1A] rounded-full z-10 flex items-center justify-center">
                                    <svg className="w-10 h-10 text-yellow-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                </div>
                                <svg className="absolute inset-0 w-24 h-24 text-yellow-500 -rotate-90 origin-center animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
                                    <circle cx="50" cy="50" r="46" fill="transparent" stroke="currentColor" strokeWidth="4" strokeDasharray="200" strokeDashoffset="100" strokeLinecap="round" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent mb-3">
                                Generating Cryptographic Proofs
                            </h3>
                            <p className="text-sm text-text-secondary mb-8 max-w-sm mx-auto leading-relaxed">
                                We are verifying {selectedVideoIds.size} videos securely against the blockchain index. This usually takes 5-15 seconds. Please don't close this window.
                            </p>

                            {/* Simulated Progress Bar */}
                            <div className="w-full max-w-sm mx-auto bg-[#2A2A2A] rounded-full h-2 mb-2 overflow-hidden relative">
                                <div className="absolute top-0 left-0 h-full bg-gradient-to-r from-yellow-300 to-yellow-600 rounded-full w-[90%] transition-all ease-out duration-[10000ms]" />
                            </div>
                            <p className="text-xs text-text-secondary font-mono tracking-widest uppercase">Executing...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="text-center py-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="w-20 h-20 rounded-full bg-green-500/10 border-2 border-green-500/20 flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>

                            <h3 className="text-2xl font-bold text-white mb-3">
                                Sync Complete!
                            </h3>
                            <p className="text-text-secondary mb-4 max-w-sm mx-auto leading-relaxed">
                                {successMessage} A summary has been sent to your email.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
