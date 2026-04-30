import { useState, useEffect } from "react"
import "./style.css"

function IndexPopup() {
    const [status, setStatus] = useState<"loading" | "verified" | "unverified" | "idle">("idle")
    const [videoInfo, setVideoInfo] = useState<any>(null)
    const [isEnabled, setIsEnabled] = useState<boolean>(true)

    useEffect(() => {
        // Load enabled state
        chrome.storage.local.get(["antiAiEnabled"], (result) => {
            const enabled = result.antiAiEnabled !== false; // Default to true
            setIsEnabled(enabled);

            if (!enabled) return; // Don't check if disabled
            checkCurrentTab();
        });
    }, [])

    const checkCurrentTab = () => {
        // Check current tab
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            const tab = tabs[0]
            if (tab.url?.includes("youtube.com/watch")) {
                const urlObj = new URL(tab.url)
                const vId = urlObj.searchParams.get("v")
                if (vId) {
                    setStatus("loading")
                    try {
                        const data = await new Promise<any>((resolve) => {
                            chrome.runtime.sendMessage({
                                action: "checkUrl",
                                videoId: vId
                            }, (response) => {
                                if (chrome.runtime.lastError) {
                                    console.error("[AntiAI] sendMessage error:", chrome.runtime.lastError);
                                    resolve(null);
                                    return;
                                }
                                resolve(response);
                            });
                        });

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
    }

    const toggleEnabled = () => {
        const newValue = !isEnabled;
        setIsEnabled(newValue);
        chrome.storage.local.set({ "antiAiEnabled": newValue }, () => {
            // Tell background and content script about the change
            chrome.runtime.sendMessage({ action: "toggleEnabled", enabled: newValue });
            if (newValue) {
                checkCurrentTab();
            } else {
                setStatus("idle");
            }
        });
    }

    return (
        <div className="w-full h-full min-h-[220px] p-4 flex flex-col justify-between bg-zinc-950 text-zinc-200">
            <div>
                {/* Header */}
                <div className="flex items-center justify-center mb-5">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center text-primary shadow-[0_0_10px_rgba(34,197,94,0.2)]">
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                        </div>
                        <h1 className="text-lg font-bold tracking-tight text-white drop-shadow-sm">
                            AntiAI
                        </h1>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="bg-white/5 backdrop-blur-md border border-white/5 rounded-xl p-4 min-h-[120px] flex items-center justify-center">
                    {!isEnabled && (
                        <div className="flex flex-col items-center justify-center text-center opacity-70">
                            <div className="w-12 h-12 rounded-full bg-zinc-800/80 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-12.728 12.728M12 21a9 9 0 110-18 9 9 0 010 18z" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-400 font-medium">Extension Disabled</p>
                        </div>
                    )}

                    {isEnabled && status === "idle" && (
                        <div className="flex flex-col items-center justify-center text-center">
                            <div className="w-12 h-12 rounded-full bg-zinc-800/50 flex items-center justify-center mb-3 border border-zinc-700/50">
                                <svg className="w-6 h-6 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                                </svg>
                            </div>
                            <p className="text-sm text-zinc-400 font-medium leading-tight">Navigate to YouTube<br/>to verify content.</p>
                        </div>
                    )}

                    {status === "loading" && isEnabled && (
                        <div className="flex flex-col items-center justify-center py-2">
                            <div className="relative w-10 h-10 mb-3">
                                <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                                <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                            </div>
                            <p className="text-xs text-primary/80 font-medium animate-pulse tracking-wider uppercase">Verifying...</p>
                        </div>
                    )}

                    {status === "verified" && isEnabled && (
                        <div className="text-center">
                            <div className="relative w-14 h-14 mx-auto mb-3">
                                <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse"></div>
                                <div className="relative w-full h-full bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                                    <svg className="w-7 h-7 text-primary drop-shadow-[0_0_8px_currentColor]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-primary font-bold text-lg mb-0.5 drop-shadow-[0_0_8px_currentColor] tracking-wide">Authentic</p>
                            <p className="text-xs text-zinc-400">Content hash verified on ledger.</p>
                        </div>
                    )}

                    {status === "unverified" && isEnabled && (
                        <div className="text-center">
                            <div className="relative w-14 h-14 mx-auto mb-3">
                                <div className="absolute inset-0 bg-red-500/20 rounded-full blur-md animate-pulse"></div>
                                <div className="relative w-full h-full bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                    <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </div>
                            </div>
                            <p className="text-red-400 font-bold text-lg mb-0.5 tracking-wide">Unverified</p>
                            <p className="text-xs text-zinc-400">No cryptographic proof found.</p>
                        </div>
                    )}
                </div>

                {/* Main Toggle Control */}
                <div className="mt-5 flex items-center justify-center gap-4 px-4 py-3 bg-zinc-900/50 rounded-xl border border-white/5 shadow-inner">
                    <span className={`text-sm font-semibold tracking-wide flex-none ${isEnabled ? 'text-primary' : 'text-zinc-500'}`}>
                        {isEnabled ? 'Protection Active' : 'Extension Disabled'}
                    </span>
                    <div className="bauble_box flex-none">
                        <input
                            type="checkbox"
                            className="bauble_input"
                            id="bauble_toggle"
                            checked={!isEnabled}
                            onChange={toggleEnabled}
                        />
                        <label className="bauble_label" htmlFor="bauble_toggle" />
                    </div>
                </div>
            </div>
            
            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/5 text-center flex items-center justify-center gap-1.5 opacity-60">
                <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <p className="text-[10px] uppercase tracking-widest text-zinc-400 font-semibold">AntiAI Protocol</p>
            </div>
        </div>
    )
}

export default IndexPopup
