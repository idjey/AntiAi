
"use client"

import { cn } from "@/lib/utils"

interface DiffViewerProps {
    oldValue: any
    newValue: any
    label: string
}

export function DiffViewer({ oldValue, newValue, label }: DiffViewerProps) {
    if (oldValue === newValue) return null;

    return (
        <div className="text-sm">
            <div className="font-medium mb-1">{label}</div>
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-red-500/10 text-red-500 p-2 rounded border border-red-500/20 overflow-hidden break-words">
                    <div className="text-xs text-muted-foreground mb-1">Before</div>
                    {typeof oldValue === 'string' && oldValue.startsWith('http') ? (
                        <img src={oldValue} alt="Old" className="w-16 h-16 object-cover rounded" />
                    ) : (
                        <span>{oldValue || '(empty)'}</span>
                    )}
                </div>
                <div className="bg-green-500/10 text-green-500 p-2 rounded border border-green-500/20 overflow-hidden break-words">
                    <div className="text-xs text-muted-foreground mb-1">After</div>
                    {typeof newValue === 'string' && newValue.startsWith('http') ? (
                        <img src={newValue} alt="New" className="w-16 h-16 object-cover rounded" />
                    ) : (
                        <span>{newValue || '(empty)'}</span>
                    )}
                </div>
            </div>
        </div>
    )
}
