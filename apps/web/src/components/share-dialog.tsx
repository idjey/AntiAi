
'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { QRCodeSVG } from 'qrcode.react';
import { Copy, Check, Share2, Download, Lock } from 'lucide-react';
import { toast } from 'sonner';

interface ShareDialogProps {
    url: string;
    handle: string;
    enableQr: boolean;
    buttonStyle?: React.CSSProperties;
    buttonClassName?: string;
    primaryColor?: string;
}

export function ShareDialog({ url, handle, enableQr, buttonStyle, buttonClassName, primaryColor = '#10b981' }: ShareDialogProps) {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success('Link copied to clipboard');
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            toast.error('Failed to copy link');
        }
    };

    const downloadQr = () => {
        const svg = document.getElementById('profile-qr-code');
        if (!svg) return;

        const svgData = new XMLSerializer().serializeToString(svg);
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx?.drawImage(img, 0, 0);
            const pngFile = canvas.toDataURL('image/png');
            const downloadLink = document.createElement('a');
            downloadLink.download = `${handle}-qr.png`;
            downloadLink.href = pngFile;
            downloadLink.click();
        };

        img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <button
                    className={buttonClassName}
                    style={buttonStyle}
                    aria-label="Share Profile"
                >
                    <Share2 className="w-5 h-5" />
                </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-zinc-950 border-white/10 text-white">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        Share @{handle}
                    </DialogTitle>
                </DialogHeader>

                {enableQr ? (
                    <Tabs defaultValue="link" className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-zinc-900">
                            <TabsTrigger value="link">Copy Link</TabsTrigger>
                            <TabsTrigger value="qr">QR Code</TabsTrigger>
                        </TabsList>
                        <TabsContent value="link" className="pt-4 space-y-4">
                            <div className="flex flex-col space-y-2">
                                <Label htmlFor="link" className="sr-only">Link</Label>
                                <div className="flex items-center space-x-2">
                                    <Input
                                        id="link"
                                        defaultValue={url}
                                        readOnly
                                        className="bg-zinc-900 border-white/10 text-white focus-visible:ring-emerald-500"
                                    />
                                    <Button
                                        size="icon"
                                        onClick={handleCopy}
                                        className="shrink-0 bg-white text-black hover:bg-white/90"
                                    >
                                        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </div>
                        </TabsContent>
                        <TabsContent value="qr" className="pt-4 flex flex-col items-center space-y-4">
                            <div className="p-4 bg-white rounded-xl">
                                <QRCodeSVG
                                    id="profile-qr-code"
                                    value={url}
                                    size={200}
                                    level="H"
                                    includeMargin
                                    fgColor="#000000"
                                    bgColor="#ffffff"
                                />
                            </div>
                            <Button variant="outline" onClick={downloadQr} className="w-full border-white/10 hover:bg-zinc-800 hover:text-white">
                                <Download className="mr-2 h-4 w-4" />
                                Download QR Code
                            </Button>
                        </TabsContent>
                    </Tabs>
                ) : (
                    <div className="space-y-4 pt-2">
                        <div className="flex flex-col space-y-2">
                            <Label htmlFor="link" className="sr-only">Link</Label>
                            <div className="flex items-center space-x-2">
                                <Input
                                    id="link"
                                    defaultValue={url}
                                    readOnly
                                    className="bg-zinc-900 border-white/10 text-white focus-visible:ring-emerald-500"
                                />
                                <Button
                                    size="icon"
                                    onClick={handleCopy}
                                    className="shrink-0 bg-white text-black hover:bg-white/90"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                </Button>
                            </div>
                        </div>
                        <div className="rounded-lg bg-zinc-900/50 border border-white/5 p-4 flex items-center justify-between text-sm text-zinc-400">
                            <div className="flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                <span>Upgrade to Pro to unlock QR Code</span>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
