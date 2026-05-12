import React from 'react';
import { Metadata } from 'next';
import { Shield, Clock, FileKey, AlertTriangle, Key } from 'lucide-react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: 'Transparency Log | AntiAI',
    description: 'A live public ledger of all AntiAI proof issuances, revocations, and key rotations.',
    openGraph: {
        title: 'Transparency Log | AntiAI',
        description: 'A live public ledger of all AntiAI proof issuances, revocations, and key rotations.',
        type: 'website',
        url: 'https://antiai.me/transparency',
    },
};

interface LogEntry {
    id: string;
    eventType: string;
    entityType: string;
    entityId: string;
    data: any;
    eventTime: string;
}

async function getLogs(): Promise<LogEntry[]> {
    try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}/public/transparency`, {
            cache: 'no-store'
        });
        if (res.ok) {
            return await res.json();
        }
        return [];
    } catch (e) {
        console.error(e);
        return [];
    }
}

export default async function TransparencyLogPage() {
    const logs = await getLogs();

    return (
        <div className="min-h-screen bg-background relative overflow-hidden pb-24">
            {/* Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/10 blur-[150px] rounded-full pointer-events-none opacity-50" />

            <section className="relative pt-24 pb-12 sm:pt-32 sm:pb-16 px-4">
                <div className="container-custom max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-6">
                        <Shield className="w-4 h-4" />
                        Public Ledger
                    </div>
                    <h1 className="text-4xl sm:text-5xl font-bold text-text-primary tracking-tight mb-6">
                        Transparency Log
                    </h1>
                    <p className="text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
                        Trust is built on verification, not blind faith. This log is a real-time record of all proof issuances, key rotations, and revocations on the AntiAI network.
                    </p>
                </div>
            </section>

            <section className="container-custom max-w-5xl mx-auto px-4 relative z-10">
                <div className="bg-surface/50 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                    <div className="border-b border-white/5 bg-white/[0.02] p-4 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-text-primary font-medium">
                            <Clock className="w-5 h-5 text-primary" />
                            Recent Activity
                        </div>
                        <div className="text-xs text-text-muted">
                            Auto-updating feed
                        </div>
                    </div>
                    
                    <div className="divide-y divide-white/5">
                        {logs.length === 0 ? (
                            <div className="p-12 text-center text-text-secondary">
                                No recent logs found.
                            </div>
                        ) : (
                            logs.map((log) => (
                                <div key={log.id} className="p-4 sm:p-6 hover:bg-white/[0.02] transition-colors flex flex-col sm:flex-row sm:items-start gap-4">
                                    <div className="flex-shrink-0 mt-1">
                                        {log.eventType === 'PROOF_ISSUED' && (
                                            <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                                                <FileKey className="w-5 h-5 text-green-500" />
                                            </div>
                                        )}
                                        {log.eventType === 'PROOF_REVOKED' && (
                                            <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center border border-red-500/20">
                                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                            </div>
                                        )}
                                        {log.eventType === 'KEY_ROTATION' && (
                                            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                                                <Key className="w-5 h-5 text-blue-500" />
                                            </div>
                                        )}
                                        {![ 'PROOF_ISSUED', 'PROOF_REVOKED', 'KEY_ROTATION' ].includes(log.eventType) && (
                                            <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                                                <Shield className="w-5 h-5 text-text-muted" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-grow space-y-1">
                                        <div className="flex flex-wrap items-center gap-2 justify-between">
                                            <h3 className="font-semibold text-text-primary">
                                                {log.eventType.replace(/_/g, ' ')}
                                            </h3>
                                            <span className="text-xs text-text-muted font-mono bg-white/5 px-2 py-1 rounded">
                                                {new Date(log.eventTime).toLocaleString()}
                                            </span>
                                        </div>
                                        
                                        <div className="text-sm text-text-secondary">
                                            <span className="font-medium text-text-primary">{log.entityType}</span> {log.entityId}
                                        </div>
                                        
                                        <div className="mt-3 bg-slate-950 rounded-lg border border-slate-800 p-3 font-mono text-xs overflow-x-auto text-slate-400">
                                            <pre>{JSON.stringify(log.data, null, 2)}</pre>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </section>
        </div>
    );
}
