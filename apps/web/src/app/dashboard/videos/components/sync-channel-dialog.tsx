'use client'

import { useState } from 'react'

interface SyncChannelDialogProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function SyncChannelDialog({ isOpen, onClose, onSuccess }: SyncChannelDialogProps) {
    const [identifier, setIdentifier] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')
    const [successMessage, setSuccessMessage] = useState('')

    if (!isOpen) return null

    const handleSync = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!identifier.trim()) return

        setIsLoading(true)
        setError('')
        setSuccessMessage('')

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
                    channelIdOrHandle: identifier.trim()
                }),
            })

            const data = await res.json()

            if (!res.ok) {
                throw new Error(data.message || 'Failed to sync channel')
            }

            setSuccessMessage(data.message || `Successfully synced videos!`)
            setTimeout(() => {
                onSuccess()
                handleClose()
            }, 2000)

        } catch (err: any) {
            console.error('Sync error:', err)
            setError(err.message || 'An unexpected error occurred during sync.')
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setIdentifier('')
        setError('')
        setSuccessMessage('')
        onClose()
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#1A1A1A] border border-white/10 rounded-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="p-6">
                    <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                                <svg className="w-5 h-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h2 className="text-xl font-bold bg-gradient-to-r from-yellow-300 to-yellow-600 bg-clip-text text-transparent">Elite Channel Sync</h2>
                                <p className="text-xs text-text-secondary">Bulk import & protect all videos</p>
                            </div>
                        </div>
                        <button onClick={handleClose} className="p-2 text-text-secondary hover:text-white transition-colors" disabled={isLoading}>
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <form onSubmit={handleSync}>
                        <div className="mb-6">
                            <p className="text-sm text-text-secondary mb-4 leading-relaxed">
                                Enter your YouTube channel handle (e.g. <strong>@MrBeast</strong>) or your 24-character Channel ID. We will automatically grab every video on your channel and generate cryptographic proofs for them.
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
                                disabled={isLoading || !!successMessage}
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

                        {successMessage && (
                            <div className="mb-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg flex items-start gap-2">
                                <svg className="w-5 h-5 text-green-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                <p className="text-sm text-green-200">{successMessage}</p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={handleClose}
                                className="px-4 py-2 font-medium text-text-secondary hover:text-white transition-colors disabled:opacity-50"
                                disabled={isLoading || !!successMessage}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={!identifier.trim() || isLoading || !!successMessage}
                                className="px-5 py-2 rounded-lg font-medium text-black bg-gradient-to-r from-yellow-400 to-yellow-600 hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2"
                            >
                                {isLoading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                                        Syncing...
                                    </>
                                ) : successMessage ? (
                                    <>Done!</>
                                ) : (
                                    <>Sync Channel</>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    )
}
