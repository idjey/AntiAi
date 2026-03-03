
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
        <div className="w-full h-full p-4 flex flex-col justify-between" style={{ backgroundColor: "#0f172a", color: "white" }}>
            <div>
                <div className="flex items-center justify-between mb-4">
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        AntiAI
                    </h1>
                    <button
                        onClick={toggleEnabled}
                        className={`w-10 h-5 rounded-full relative transition-colors ${isEnabled ? 'bg-green-500' : 'bg-slate-600'}`}
                        aria-label="Toggle Extension"
                    >
                        <div className={`w-4 h-4 rounded-full bg-white absolute top-0.5 transition-transform`} style={{ transform: isEnabled ? 'translateX(22px)' : 'translateX(2px)' }} />
                    </button>
                </div>

                {!isEnabled && (
                    <div className="flex flex-col items-center justify-center py-6 text-center">
                        <svg className="w-12 h-12 text-slate-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636l-12.728 12.728M12 21a9 9 0 110-18 9 9 0 010 18z" />
                        </svg>
                        <p className="text-slate-400 font-medium">Extension is Disabled</p>
                    </div>
                )}

                {isEnabled && status === "idle" && (
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
            {isEnabled && (
                <div className="mt-4 pt-4 border-t border-slate-800 text-center">
                    <p className="text-[10px] text-slate-500">AntiAI Verification Protocol</p>
                </div>
            )}
        </div>
    )
}

export default IndexPopup
