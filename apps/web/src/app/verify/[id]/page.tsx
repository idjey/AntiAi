'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface VerificationData {
    video: {
        id: string
        title: string
        thumbnail_url: string
        published_at: string
        youtube_video_id: string
    }
    channel: {
        id: string
        name: string
        handle: string
        avatar_url: string | null
        verification_status: string
        verified_at: string
    }
    proof: {
        id: string
        alg: string
        kid: string
        issued_at: string
        expires_at: string
        status: string
    } | null
}

export default function VerificationPage() {
    const params = useParams()
    const [data, setData] = useState<VerificationData | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        const fetchVerification = async () => {
            try {
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/proofs/public/verify/${params.id}`)

                if (!res.ok) {
                    if (res.status === 404) throw new Error('Video not found')
                    throw new Error('Failed to verify video')
                }

                const data = await res.json()
                setData(data)
            } catch (err: any) {
                console.error(err)
                setError(err.message)
            } finally {
                setIsLoading(false)
            }
        }

        if (params.id) {
            fetchVerification()
        }
    }, [params.id])

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !data) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
                <div className="card max-w-md w-full p-8 text-center border-red-500/20">
                    <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold mb-2">Verification Failed</h1>
                    <p className="text-text-secondary mb-6">{error || 'Unable to verify this content.'}</p>
                    <Link href="/" className="btn-primary">
                        Return Home
                    </Link>
                </div>
            </div>
        )
    }

    const { video, channel, proof } = data
    const isVerified = proof && proof.status === 'active'

    return (
        <div className="min-h-screen bg-background py-12 px-4 flex flex-col items-center">
            {/* Certificate Card */}
            <div className="w-full max-w-2xl bg-surface border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="bg-surface-light border-b border-white/5 p-8 text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-secondary to-primary" />
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-surface border border-white/10 text-xs font-mono text-text-secondary mb-4">
                        ANTIAI VERIFICATION PROTOCOL
                    </div>
                    <h1 className="text-3xl font-bold mb-2">Certificate of Authenticity</h1>
                    <p className="text-text-secondary">
                        This content has been cryptographically signed and verified.
                    </p>
                </div>

                <div className="p-8 space-y-8">
                    {/* Status Badge */}
                    <div className="flex justify-center">
                        {isVerified ? (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 border border-green-500/20 shadow-[0_0_30px_-10px_rgba(34,197,94,0.3)]">
                                    <svg className="w-8 h-8" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="text-green-500 font-bold text-lg">Verified Authentic</div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 border border-red-500/20">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="text-red-500 font-bold text-lg">Verification Failed</div>
                            </div>
                        )}
                    </div>

                    {/* Content Details */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div>
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Content</h3>
                            <a
                                href={`https://youtube.com/watch?v=${video.youtube_video_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block group"
                            >
                                <div className="aspect-video bg-surface-light rounded-lg overflow-hidden border border-white/5 mb-3 group-hover:border-primary/50 transition-colors">
                                    <img
                                        src={video.thumbnail_url}
                                        alt={video.title}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <h4 className="font-bold leading-tight group-hover:text-primary transition-colors">
                                    {video.title}
                                </h4>
                            </a>
                        </div>

                        <div>
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Creator</h3>
                            <div className="flex items-center gap-4 bg-surface-light p-4 rounded-lg border border-white/5">
                                {channel.avatar_url ? (
                                    <img src={channel.avatar_url} alt={channel.name} className="w-12 h-12 rounded-full" />
                                ) : (
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                        {channel.name.charAt(0)}
                                    </div>
                                )}
                                <div>
                                    <div className="font-bold flex items-center gap-1.5">
                                        {channel.name}
                                        <svg className="w-4 h-4 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                        </svg>
                                    </div>
                                    <div className="text-sm text-text-secondary">{channel.handle || 'Verified Creator'}</div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Technical Proof Details */}
                    {proof && (
                        <div className="pt-8 border-t border-white/5">
                            <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-4">Cryptographic Proof</h3>
                            <div className="bg-black/30 rounded-lg border border-white/5 p-4 font-mono text-xs overflow-x-auto">
                                <div className="grid grid-cols-[100px_1fr] gap-2">
                                    <div className="text-text-secondary">Proof ID:</div>
                                    <div className="text-white">{proof.id}</div>

                                    <div className="text-text-secondary">Algorithm:</div>
                                    <div className="text-primary">{proof.alg}</div>

                                    <div className="text-text-secondary">Key ID:</div>
                                    <div className="text-text-muted">{proof.kid}</div>

                                    <div className="text-text-secondary">Issued:</div>
                                    <div>{new Date(proof.issued_at).toUTCString()}</div>

                                    <div className="text-text-secondary">Expires:</div>
                                    <div>{new Date(proof.expires_at).toUTCString()}</div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-surface-light border-t border-white/5 p-6 text-center">
                    <p className="text-xs text-text-muted mb-4">
                        This verification page is hosted by AntiAi. It confirms that the content was registered by the verified owner of the channel.
                    </p>
                    <Link href="/" className="text-sm font-bold text-primary hover:underline">
                        Learn more about AntiAi
                    </Link>
                </div>
            </div>
        </div>
    )
}
