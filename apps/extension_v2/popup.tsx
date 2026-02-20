
import { useState, useEffect } from "react"
import "./style.css"

function IndexPopup() {
    const [status, setStatus] = useState<"loading" | "verified" | "unverified" | "idle">("idle")
    const [videoInfo, setVideoInfo] = useState<any>(null)

    useEffect(() => {
        // Check current tab
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0]
            if (tab.url?.includes("youtube.com/watch")) {
                const urlObj = new URL(tab.url)
                const vId = urlObj.searchParams.get("v")
                if (vId) {
                    setStatus("loading")
                    try {
                        const res = await fetch(`http://localhost:4000/public/verify?youtube_video_id=${vId}`)
                        const data = await res.json()
                        if (data && data.status === 'verified') {
                            setStatus("verified")
                            setVideoInfo(data)
                        } else {
                            setStatus("unverified")
                        }
                    } catch (e) {
                        setStatus("unverified")
                    }
                }
            }
        })
    }, [])

    return (
        <div className="w-64 p-4 bg-slate-900 text-white min-h-[200px] flex flex-col items-center justify-center">
            <h1 className="text-xl font-bold mb-4 flex items-center gap-2">
                AntiAI
            </h1>

            {status === "idle" && (
                <p className="text-slate-400 text-center">Navigate to a YouTube video to verify content.</p>
            )}

            {status === "loading" && (
                <div className="animate-spin h-8 w-8 border-4 border-green-500 rounded-full border-t-transparent"></div>
            )}

            {status === "verified" && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2 icon-pulse">
                        <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <p className="text-green-400 font-bold mb-1">Authenticated</p>
                    <p className="text-xs text-slate-400">Content hash matches ledger.</p>
                </div>
            )}

            {status === "unverified" && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                        <svg className="w-10 h-10 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </div>
                    <p className="text-red-400 font-bold mb-1">Unverified</p>
                    <p className="text-xs text-slate-400">No valid proof found.</p>
                </div>
            )}
        </div>
    )
}

export default IndexPopup
