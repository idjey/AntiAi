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
        <div className="w-[160px] h-[160px] flex flex-col justify-between bg-zinc-950 text-zinc-200 overflow-hidden shadow-inner">
            {/* Top Bar - Brand */}
            <div className="flex items-center justify-center w-full py-1.5 bg-zinc-900/50 border-b border-white/5">
                <div className="flex items-center gap-1.5 opacity-90">
                    <div className="w-4 h-4 rounded-sm bg-primary/20 flex items-center justify-center text-primary">
                        <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <span className="text-[10px] font-bold tracking-widest uppercase">AntiAI</span>
                </div>
            </div>

            {/* Middle - Dynamic Status */}
            <div className="flex-1 flex flex-col items-center justify-center px-2">
                {!isEnabled && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-zinc-800/80 flex items-center justify-center mb-1.5">
                            <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-12.728 12.728M12 21a9 9 0 110-18 9 9 0 010 18z" />
                            </svg>
                        </div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wide">Disabled</p>
                    </div>
                )}

                {isEnabled && status === "idle" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="w-8 h-8 rounded-full bg-zinc-800/50 border border-zinc-700/50 flex items-center justify-center mb-1.5">
                            <svg className="w-4 h-4 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                        </div>
                        <p className="text-[9px] text-center text-zinc-400 leading-tight">Ready to verify</p>
                    </div>
                )}

                {isEnabled && status === "loading" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="relative w-7 h-7 mb-1.5">
                            <div className="absolute inset-0 border-2 border-primary/20 rounded-full"></div>
                            <div className="absolute inset-0 border-2 border-primary rounded-full border-t-transparent animate-spin"></div>
                        </div>
                        <p className="text-[9px] font-bold text-primary animate-pulse tracking-widest uppercase">Checking</p>
                    </div>
                )}

                {isEnabled && status === "verified" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="relative w-9 h-9 mb-1.5">
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-sm animate-pulse"></div>
                            <div className="relative w-full h-full bg-primary/20 rounded-full flex items-center justify-center border border-primary/30 shadow-[0_0_10px_rgba(34,197,94,0.3)]">
                                <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-[11px] font-extrabold text-primary tracking-wide drop-shadow-[0_0_5px_rgba(34,197,94,0.5)]">AUTHENTIC</p>
                    </div>
                )}

                {isEnabled && status === "unverified" && (
                    <div className="flex flex-col items-center animate-in fade-in zoom-in duration-300">
                        <div className="relative w-9 h-9 mb-1.5">
                            <div className="absolute inset-0 bg-red-500/20 rounded-full blur-sm animate-pulse"></div>
                            <div className="relative w-full h-full bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20">
                                <svg className="w-5 h-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                        </div>
                        <p className="text-[11px] font-extrabold text-red-400 tracking-wide drop-shadow-[0_0_5px_rgba(239,68,68,0.5)]">UNVERIFIED</p>
                    </div>
                )}
            </div>

            {/* Bottom - Bauble Toggle */}
            <div className="w-full flex items-center justify-center pb-2 bg-gradient-to-t from-zinc-900 to-transparent pt-3">
                <div className="bauble_box transform scale-[0.65] origin-bottom hover:scale-[0.7] transition-transform">
                    <input
                        type="checkbox"
                        className="bauble_input"
                        id="bauble_toggle"
                        checked={!isEnabled}
                        onChange={toggleEnabled}
                    />
                    <label className="bauble_label shadow-xl" htmlFor="bauble_toggle" />
                </div>
            </div>
        </div>
    )
}

export default IndexPopup
