'use client'

import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    footer?: React.ReactNode
}

export default function Modal({ isOpen, onClose, title, children, footer }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }

        if (isOpen) {
            document.addEventListener('keydown', handleEscape)
            document.body.style.overflow = 'hidden'
        }

        return () => {
            document.removeEventListener('keydown', handleEscape)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose])

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                ref={modalRef}
                className="bg-surface border border-white/10 rounded-xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/5">
                    <h3 className="text-xl font-bold text-text-primary">{title}</h3>
                    <button
                        onClick={onClose}
                        className="text-text-secondary hover:text-text-primary transition-colors p-1 rounded-lg hover:bg-white/5"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 text-text-secondary">
                    {children}
                </div>

                {/* Footer */}
                {footer && (
                    <div className="flex items-center justify-end gap-3 p-6 border-t border-white/5 bg-surface-light/30 rounded-b-xl">
                        {footer}
                    </div>
                )}
            </div>

            {/* Backdrop click handler */}
            <div className="absolute inset-0 -z-10" onClick={onClose} />
        </div>
    )
}
