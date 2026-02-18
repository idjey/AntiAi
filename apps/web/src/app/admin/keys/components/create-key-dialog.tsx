'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Plus, Copy, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export function CreateKeyDialog() {
    const router = useRouter()
    const [open, setOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [createdKey, setCreatedKey] = useState<{ id: string, privateKey: string } | null>(null)

    const handleCreate = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/keys`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            })

            if (!res.ok) throw new Error('Failed to create key')

            const data = await res.json()
            setCreatedKey(data)
            router.refresh()
            toast.success('Key created successfully')
        } catch (error) {
            toast.error('Failed to create key')
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleClose = () => {
        setCreatedKey(null)
        setOpen(false)
    }

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v && createdKey) handleClose(); else setOpen(v); }}>
            <DialogTrigger asChild>
                <Button>
                    <Plus className="mr-2 h-4 w-4" /> Create New Key
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                {!createdKey ? (
                    <>
                        <DialogHeader>
                            <DialogTitle>Create Signing Key</DialogTitle>
                            <DialogDescription>
                                This will generate a new Ed25519 key pair. The private key will be shown
                                <strong> ONLY ONCE</strong>.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <div className="flex items-center p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-600 dark:text-yellow-400">
                                <AlertTriangle className="h-5 w-5 mr-3 shrink-0" />
                                <div className="text-sm">
                                    Ensure you are ready to copy the private key to your secure storage immediately.
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreate} disabled={isLoading}>
                                {isLoading ? 'Generating...' : 'Generate Key Pair'}
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Key Generated Successfully</DialogTitle>
                            <DialogDescription>
                                Please copy this private key securely. It will not be shown again.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Key ID</Label>
                                <Input value={createdKey.id} readOnly />
                            </div>
                            <div className="grid gap-2">
                                <Label>Private Key (Base64)</Label>
                                <div className="relative">
                                    <Textarea
                                        value={createdKey.privateKey}
                                        readOnly
                                        className="font-mono text-xs min-h-[100px] pr-10"
                                    />
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className="absolute top-2 right-2 h-6 w-6"
                                        onClick={() => {
                                            navigator.clipboard.writeText(createdKey.privateKey)
                                            toast.success('Copied to clipboard')
                                        }}
                                    >
                                        <Copy className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleClose} className="w-full">
                                I have copied the key
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    )
}
