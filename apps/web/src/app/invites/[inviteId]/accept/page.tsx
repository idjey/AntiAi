'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Toaster, toast } from 'sonner'
import Link from 'next/link'

export default function AcceptInvitePage({ params }: { params: { inviteId: string } }) {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isAccepting, setIsAccepting] = useState(false)
    const [isResending, setIsResending] = useState(false)
    const [errorState, setErrorState] = useState<'unverified' | 'wrong_email' | 'expired' | 'generic' | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [inviteDetails, setInviteDetails] = useState<any>(null)
    const [userEmail, setUserEmail] = useState<string>('')

    useEffect(() => {
        // Just fetch details to show what org this is for
        // We will do a generic GET if the backend supports it, else we wait for them to click accept.
        // The spec implies we attempt to accept it, and if it fails, we show the honest UI.
        // We will fetch the current user's email to pass to the resend-otp if needed.
        const init = async () => {
            try {
                const token = localStorage.getItem('token')
                if (!token) {
                    router.push(`/login?redirect=/invites/${params.inviteId}/accept`)
                    return
                }

                // Get current user info for email
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
                const userRes = await fetch(`${apiUrl}/auth/me`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
                if (userRes.ok) {
                    const userData = await userRes.json()
                    setUserEmail(userData.email)
                }

                setIsLoading(false)
            } catch (err) {
                console.error(err)
                setIsLoading(false)
            }
        }
        init()
    }, [params.inviteId, router])

    const handleAccept = async () => {
        setIsAccepting(true)
        setErrorState(null)
        setErrorMessage('')

        try {
            const token = localStorage.getItem('token')
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            
            // Assuming the endpoint uses the invite ID in the path and finds the org. 
            // Or the endpoint is /api/v1/invites/:inviteId/accept.
            // Based on backend tests, it might be /api/v1/organizations/:id/invites/:inviteId/accept.
            // Wait, if we don't know the org ID, we might have a global invite accept endpoint.
            // Let's assume there is a global /invites/:inviteId/accept since the user URL is /invites/[inviteId]/accept.
            // If the backend requires the orgId in the path, we would need it.
            // Actually, in the test it was POST `/organizations/${orgId}/invites/${inviteId}/accept`.
            // But we can't do that if we don't know the orgId! Wait, the backend test matrix says:
            // @Post(':id/invites/:inviteId/accept')
            // This implies the URL in the frontend needs the orgId, OR the backend provides a global one.
            // If we don't have the orgId, maybe the frontend gets it from the URL? 
            // Let's check what the user requested: "The Accept Invite Flow (/invites/[inviteId]/accept/page.tsx)"
            // Ok, I will use a global endpoint or assume the backend accepts it. If it fails, we'll see.
            // Let's assume we post to `/invites/${params.inviteId}/accept` which we can add to backend if it's missing, but wait, the backend is closed! 
            // The backend closed report says: `POST /organizations/:id/invites/:inviteId/accept`. 
            // If the URL is `/invites/[inviteId]/accept`, how do we know the orgId? 
            // The user must pass `?orgId=xxx` in the query params when sending the invite link!
            const searchParams = new URLSearchParams(window.location.search)
            const orgId = searchParams.get('orgId')

            if (!orgId) {
                throw new Error("Missing organization ID in the invite link.")
            }

            const res = await fetch(`${apiUrl}/organizations/${orgId}/invites/${params.inviteId}/accept`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            })

            if (!res.ok) {
                const err = await res.json()
                const msg = err.message || ''
                
                if (res.status === 403 && msg.toLowerCase().includes('verified')) {
                    setErrorState('unverified')
                    setErrorMessage('Verify your email first.')
                } else if (res.status === 403 && msg.toLowerCase().includes('match')) {
                    setErrorState('wrong_email')
                    setErrorMessage('This invite is for a different address.')
                } else if (res.status === 400 && msg.toLowerCase().includes('expired')) {
                    setErrorState('expired')
                    setErrorMessage('This invite expired.')
                } else {
                    setErrorState('generic')
                    setErrorMessage(msg || 'Failed to accept invite')
                }
                setIsAccepting(false)
                return
            }

            const data = await res.json()
            toast.success('Invite accepted successfully!')
            router.push(`/orgs/${orgId}`)
        } catch (error: any) {
            setErrorState('generic')
            setErrorMessage(error.message)
            setIsAccepting(false)
        }
    }

    const handleResendVerification = async () => {
        setIsResending(true)
        try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
            const res = await fetch(`${apiUrl}/auth/resend-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: userEmail })
            })
            
            if (!res.ok) throw new Error('Failed to resend verification email')
            
            toast.success('Verification email sent! Check your inbox.')
            // Redirect to signup verify page
            setTimeout(() => {
                router.push(`/signup?step=verify&email=${encodeURIComponent(userEmail)}`)
            }, 2000)
        } catch (error: any) {
            toast.error(error.message || 'Something went wrong')
        } finally {
            setIsResending(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#0C0C0C] flex items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-white/10 border-t-white"></div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0C0C0C] flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md bg-[#111111] border border-white/10 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 19v-8.93a2 2 0 01.89-1.664l7-4.666a2 2 0 012.22 0l7 4.666A2 2 0 0121 10.07V19M3 19a2 2 0 002 2h14a2 2 0 002-2M3 19l6.75-4.5M21 19l-6.75-4.5M3 10l6.75 4.5M21 10l-6.75 4.5m0 0l-1.14.76a2 2 0 01-2.22 0l-1.14-.76" />
                    </svg>
                </div>
                
                <h1 className="text-2xl font-bold text-white mb-2">Organization Invite</h1>
                
                {!errorState ? (
                    <>
                        <p className="text-white/60 mb-8">You have been invited to join an organization.</p>
                        <button
                            onClick={handleAccept}
                            disabled={isAccepting}
                            className="w-full bg-white text-black font-medium rounded-xl py-3 hover:bg-white/90 transition-colors disabled:opacity-50"
                        >
                            {isAccepting ? 'Accepting...' : 'Accept Invitation'}
                        </button>
                    </>
                ) : (
                    <div className="animate-in fade-in zoom-in-95 duration-200">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-left">
                            <div className="flex items-start gap-3">
                                <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <div>
                                    <h3 className="text-red-400 font-medium">Invitation Failed</h3>
                                    <p className="text-sm text-red-400/80 mt-1">{errorMessage}</p>
                                </div>
                            </div>
                        </div>

                        {errorState === 'unverified' && (
                            <button
                                onClick={handleResendVerification}
                                disabled={isResending}
                                className="w-full bg-white text-black font-medium rounded-xl py-3 hover:bg-white/90 transition-colors disabled:opacity-50"
                            >
                                {isResending ? 'Sending Email...' : 'Resend Verification Email'}
                            </button>
                        )}
                        
                        {errorState === 'wrong_email' && (
                            <button
                                onClick={() => {
                                    localStorage.removeItem('token')
                                    router.push('/login')
                                }}
                                className="w-full bg-white/10 text-white font-medium rounded-xl py-3 hover:bg-white/20 transition-colors"
                            >
                                Log out & switch accounts
                            </button>
                        )}
                        
                        {errorState === 'expired' && (
                            <Link 
                                href="/dashboard"
                                className="block w-full bg-white/10 text-white font-medium rounded-xl py-3 hover:bg-white/20 transition-colors"
                            >
                                Return to Dashboard
                            </Link>
                        )}
                    </div>
                )}
            </div>
            <Toaster theme="dark" />
        </div>
    )
}
