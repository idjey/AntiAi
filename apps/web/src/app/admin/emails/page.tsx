'use client'

import { useState, useEffect, useRef } from 'react'
import { Mail, Plus, Send, Trash2, Edit3, X, Users, Sparkles, Eye, BarChart3, Clock, CheckCircle2, AlertCircle, Loader2, AtSign, Image, Link2, Minus, Share2, MailX, SendHorizonal } from 'lucide-react'

const API = () => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
const headers = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
    'Content-Type': 'application/json'
})

type Campaign = {
    id: string; name: string; subject: string; htmlContent: string;
    status: string; audienceSegment: string; scheduledAt: string | null;
    sentAt: string | null; createdAt: string; _count?: { events: number }
}

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
    draft: { bg: 'bg-blue-500/10', text: 'text-blue-400', label: 'Draft' },
    sending: { bg: 'bg-amber-500/10', text: 'text-amber-400', label: 'Sending' },
    sent: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', label: 'Sent' },
    failed: { bg: 'bg-red-500/10', text: 'text-red-400', label: 'Failed' },
    scheduled: { bg: 'bg-purple-500/10', text: 'text-purple-400', label: 'Scheduled' },
}

const SEGMENTS = [
    { value: 'all', label: 'All Verified Users', desc: 'Every user with a verified email' },
    { value: 'elite_only', label: 'Elite Subscribers', desc: 'Only users on the Elite plan' },
    { value: 'pro_only', label: 'Pro Subscribers', desc: 'Only users on the Pro plan' },
    { value: 'free_only', label: 'Free Users', desc: 'Users on the free tier' },
]

export default function AdminEmailsPage() {
    const [campaigns, setCampaigns] = useState<Campaign[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [showEditor, setShowEditor] = useState(false)
    const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
    const [previewHtml, setPreviewHtml] = useState<string | null>(null)
    const [sendingId, setSendingId] = useState<string | null>(null)
    const [aiPrompt, setAiPrompt] = useState('')
    const [isGenerating, setIsGenerating] = useState(false)
    const [aiSuccess, setAiSuccess] = useState(false)
    const [testEmail, setTestEmail] = useState('')
    const [isSendingTest, setIsSendingTest] = useState(false)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const [form, setForm] = useState({
        name: '', subject: '', htmlContent: '', audienceSegment: 'all', customEmails: ''
    })

    const openPreviewWindow = (html: string) => {
        const w = window.open('', '_blank', 'width=700,height=800,scrollbars=yes,resizable=yes')
        if (w) {
            w.document.write(html)
            w.document.close()
            w.document.title = 'Email Preview — AntiAI.me'
        }
    }

    const insertSnippet = (snippet: string) => {
        const ta = textareaRef.current
        if (!ta) { setForm(f => ({ ...f, htmlContent: f.htmlContent + snippet })); return }
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const before = form.htmlContent.substring(0, start)
        const after = form.htmlContent.substring(end)
        setForm(f => ({ ...f, htmlContent: before + snippet + after }))
        setTimeout(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = start + snippet.length }, 0)
    }

    const handleSendTest = async () => {
        if (!testEmail.includes('@') || !form.htmlContent) return
        setIsSendingTest(true)
        try {
            const res = await fetch(`${API()}/admin/emails/test-send`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ to: testEmail, subject: form.subject || 'Test Email', htmlContent: form.htmlContent })
            })
            const data = await res.json()
            alert(data.message || 'Test email sent!')
        } catch (err) { alert('Failed to send test email') }
        finally { setIsSendingTest(false) }
    }

    const SNIPPETS = [
        { label: 'Logo', icon: <Image className="w-3.5 h-3.5" />, code: '<div style="text-align:center;margin-bottom:32px;"><img src="https://antiai.me/images/logo-dark.png" alt="AntiAI.me" style="height:40px;" /></div>' },
        { label: 'CTA Button', icon: <Link2 className="w-3.5 h-3.5" />, code: '<div style="text-align:center;margin:32px 0;"><a href="https://antiai.me" style="display:inline-block;background-color:#22C55E;color:#000;font-weight:700;padding:14px 36px;border-radius:10px;text-decoration:none;font-size:15px;">Click Here</a></div>' },
        { label: 'Divider', icon: <Minus className="w-3.5 h-3.5" />, code: '<hr style="border:none;border-top:1px solid rgba(255,255,255,0.08);margin:24px 0;" />' },
        { label: 'Social Links', icon: <Share2 className="w-3.5 h-3.5" />, code: '<div style="text-align:center;margin-top:24px;"><a href="https://twitter.com/antiaime" style="color:#64748b;text-decoration:underline;margin:0 8px;">Twitter</a><a href="https://youtube.com/@antiaime" style="color:#64748b;text-decoration:underline;margin:0 8px;">YouTube</a><a href="https://discord.gg/antiai" style="color:#64748b;text-decoration:underline;margin:0 8px;">Discord</a></div>' },
        { label: 'Unsubscribe', icon: <MailX className="w-3.5 h-3.5" />, code: '<p style="text-align:center;margin-top:32px;font-size:11px;color:#475569;">You received this email because you\'re registered on AntiAI.me. <a href="https://antiai.me/settings" style="color:#64748b;text-decoration:underline;">Unsubscribe</a></p>' },
    ]

    const fetchCampaigns = async () => {
        setIsLoading(true)
        try {
            const res = await fetch(`${API()}/admin/emails/campaigns`, { headers: headers() })
            if (res.ok) {
                const data = await res.json()
                setCampaigns(Array.isArray(data) ? data : [])
            }
        } catch (err) { console.error(err) }
        finally { setIsLoading(false) }
    }

    useEffect(() => { fetchCampaigns() }, [])

    const resetForm = () => {
        setForm({ name: '', subject: '', htmlContent: '', audienceSegment: 'all', customEmails: '' })
        setEditingCampaign(null)
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            if (editingCampaign) {
                await fetch(`${API()}/admin/emails/campaigns/${editingCampaign.id}`, {
                    method: 'PUT', headers: headers(), body: JSON.stringify(form)
                })
            } else {
                await fetch(`${API()}/admin/emails/campaigns`, {
                    method: 'POST', headers: headers(), body: JSON.stringify(form)
                })
            }
            setShowEditor(false)
            resetForm()
            fetchCampaigns()
        } catch (err) { console.error(err) }
    }

    const handleSend = async (id: string) => {
        if (!confirm('Send this campaign to all targeted users? This action cannot be undone.')) return
        setSendingId(id)
        try {
            await fetch(`${API()}/admin/emails/campaigns/${id}/send`, {
                method: 'POST', headers: headers()
            })
            fetchCampaigns()
        } catch (err) { console.error(err) }
        finally { setSendingId(null) }
    }

    const handleEdit = (c: any) => {
        setForm({ name: c.name, subject: c.subject, htmlContent: c.htmlContent, audienceSegment: c.audienceSegment, customEmails: c.customEmails || '' })
        setEditingCampaign(c)
        setShowEditor(true)
    }

    const handleGenerateAi = async () => {
        if (!aiPrompt.trim()) return
        setIsGenerating(true)
        setAiSuccess(false)
        try {
            const res = await fetch(`${API()}/admin/emails/generate`, {
                method: 'POST', headers: headers(),
                body: JSON.stringify({ prompt: aiPrompt })
            })
            if (res.ok) {
                const data = await res.json()
                setForm(f => ({
                    ...f,
                    subject: data.subject || f.subject,
                    htmlContent: data.htmlContent || f.htmlContent
                }))
                setAiPrompt('')
                setAiSuccess(true)
                setTimeout(() => setAiSuccess(false), 3000)
            } else {
                const err = await res.json().catch(() => ({}))
                alert(err.message || 'Failed to generate email content')
            }
        } catch (err) { console.error(err); alert('Network error — check API connection') }
        finally { setIsGenerating(false) }
    }

    const stats = {
        total: campaigns.length,
        sent: campaigns.filter(c => c.status === 'sent').length,
        drafts: campaigns.filter(c => c.status === 'draft').length,
    }

    if (isLoading) {
        return (
            <div className="space-y-6 animate-pulse">
                <div className="h-24 bg-white/5 rounded-xl border border-white/10" />
                <div className="grid grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => <div key={i} className="h-32 bg-white/5 rounded-xl border border-white/10" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex justify-between items-center bg-surface p-6 rounded-xl border border-white/10">
                <div>
                    <h1 className="text-3xl font-bold font-mono tracking-tight text-white">
                        Email <span className="text-cyan-400 opacity-80">Campaigns</span>
                    </h1>
                    <p className="text-white/50 mt-1 font-mono text-sm">Create, manage, and send email campaigns to your users</p>
                </div>
                <button
                    onClick={() => { resetForm(); setShowEditor(true) }}
                    className="flex items-center gap-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg px-4 py-2.5 text-sm font-medium transition-all hover:scale-[1.02]"
                >
                    <Plus className="w-4 h-4" /> New Campaign
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                    { label: 'Total Campaigns', value: stats.total, icon: <Mail className="w-6 h-6" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
                    { label: 'Sent', value: stats.sent, icon: <CheckCircle2 className="w-6 h-6" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                    { label: 'Drafts', value: stats.drafts, icon: <Edit3 className="w-6 h-6" />, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                ].map((card, i) => (
                    <div key={i} className="p-6 rounded-xl bg-surface border border-white/10 hover:border-white/20 transition-all group">
                        <div className="flex justify-between items-start mb-4">
                            <span className={`p-3 rounded-xl ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>{card.icon}</span>
                        </div>
                        <h3 className="text-3xl font-bold text-text-primary mb-1 font-mono tracking-tight">{card.value}</h3>
                        <p className="text-sm font-medium text-text-secondary">{card.label}</p>
                    </div>
                ))}
            </div>

            {/* Campaigns Table */}
            <div className="p-6 rounded-xl bg-surface border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                    <span className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400"><Mail className="w-5 h-5" /></span>
                    <h2 className="text-lg font-bold font-mono tracking-tight">All Campaigns</h2>
                </div>
                <div className="overflow-auto rounded-lg border border-white/5 max-h-[600px]">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-text-muted bg-white/5 uppercase sticky top-0 z-10 backdrop-blur-md">
                            <tr>
                                <th className="px-4 py-3">Campaign</th>
                                <th className="px-4 py-3">Subject</th>
                                <th className="px-4 py-3">Audience</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {campaigns.length > 0 ? campaigns.map((c) => {
                                const s = STATUS_STYLES[c.status] || STATUS_STYLES.draft
                                return (
                                    <tr key={c.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-text-primary">{c.name}</td>
                                        <td className="px-4 py-3 text-text-secondary max-w-[200px] truncate">{c.subject}</td>
                                        <td className="px-4 py-3">
                                            <span className="px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase bg-white/5 text-text-secondary">
                                                {c.audienceSegment.replace('_', ' ')}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 text-[10px] font-bold tracking-wider rounded-md uppercase ${s.bg} ${s.text}`}>
                                                {s.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-text-muted text-xs font-mono">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3" />
                                                {new Date(c.sentAt || c.createdAt).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1">
                                                <button onClick={() => openPreviewWindow(c.htmlContent)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-cyan-400 transition-colors" title="Preview"><Eye className="w-4 h-4" /></button>
                                                {c.status === 'draft' && (
                                                    <>
                                                        <button onClick={() => handleEdit(c)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-blue-400 transition-colors" title="Edit"><Edit3 className="w-4 h-4" /></button>
                                                        <button
                                                            onClick={() => handleSend(c.id)}
                                                            disabled={sendingId === c.id}
                                                            className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-emerald-400 transition-colors disabled:opacity-30"
                                                            title="Send"
                                                        >
                                                            {sendingId === c.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )
                            }) : (
                                <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-text-muted font-mono">
                                        <Mail className="w-10 h-10 mx-auto mb-3 opacity-30" />
                                        No campaigns yet. Click &quot;New Campaign&quot; to get started.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>



            {/* Editor Modal */}
            {showEditor && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowEditor(false)}>
                    <div className="bg-surface border border-white/10 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center p-6 border-b border-white/10">
                            <h2 className="text-xl font-bold font-mono">{editingCampaign ? 'Edit Campaign' : 'New Campaign'}</h2>
                            <button onClick={() => setShowEditor(false)} className="p-2 hover:bg-white/10 rounded-lg text-text-muted hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                        </div>
                        <form onSubmit={handleSave} className="flex-1 overflow-auto p-6 space-y-5">
                            {/* Name & Subject */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Campaign Name</label>
                                    <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="May Newsletter" required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-500/50" />
                                </div>
                                <div>
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">Email Subject</label>
                                    <input type="text" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Exciting updates from AntiAI.me!" required
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary placeholder-text-muted focus:outline-none focus:border-cyan-500/50" />
                                </div>
                            </div>

                            {/* Audience Segment */}
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-2">
                                    <Users className="w-3.5 h-3.5 inline mr-1" /> Target Audience
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {SEGMENTS.map(seg => (
                                        <button type="button" key={seg.value}
                                            onClick={() => setForm(f => ({ ...f, audienceSegment: seg.value }))}
                                            className={`p-3 rounded-lg border text-left transition-all ${form.audienceSegment === seg.value
                                                ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                                                : 'border-white/10 bg-white/5 text-text-secondary hover:border-white/20'}`}
                                        >
                                            <span className="text-xs font-bold block">{seg.label}</span>
                                            <span className="text-[10px] opacity-60 mt-0.5 block">{seg.desc}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Custom Emails */}
                            <div>
                                <label className="text-xs text-text-muted uppercase tracking-wider font-mono block mb-1">
                                    <AtSign className="w-3.5 h-3.5 inline mr-1" /> Individual Emails (optional)
                                </label>
                                <input type="text" value={form.customEmails} onChange={e => setForm(f => ({ ...f, customEmails: e.target.value }))}
                                    placeholder="ryan@example.com, creator@youtube.com, partner@brand.com"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono text-sm placeholder-text-muted focus:outline-none focus:border-cyan-500/50" />
                                <p className="text-[11px] text-text-muted mt-1.5 font-mono">Comma-separated. If provided, this overrides the audience segment above and sends only to these addresses.</p>
                            </div>

                            {/* AI Generator */}
                            <div className={`p-4 rounded-xl bg-gradient-to-r from-purple-500/5 to-cyan-500/5 border transition-colors ${aiSuccess ? 'border-emerald-500/40' : 'border-purple-500/20'}`}>
                                <label className="text-xs text-purple-400 uppercase tracking-wider font-mono block mb-2">
                                    <Sparkles className="w-3.5 h-3.5 inline mr-1" /> AI Content Generator
                                    {aiSuccess && <span className="ml-2 text-emerald-400 normal-case">✓ Content generated — check Subject & HTML below</span>}
                                </label>
                                <div className="flex gap-2">
                                    <input type="text" value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleGenerateAi() } }}
                                        placeholder="Try: welcome email, elite upgrade offer, security update, new feature launch..."
                                        className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-text-primary placeholder-text-muted focus:outline-none focus:border-purple-500/50" />
                                    <button type="button" onClick={handleGenerateAi} disabled={isGenerating || !aiPrompt.trim()}
                                        className="px-4 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-30 flex items-center gap-2">
                                        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                                        Generate
                                    </button>
                                </div>
                            </div>

                            {/* HTML Editor with Quick Insert Toolbar */}
                            <div>
                                <div className="flex items-center justify-between mb-1">
                                    <label className="text-xs text-text-muted uppercase tracking-wider font-mono">HTML Content</label>
                                    <div className="flex items-center gap-1">
                                        {SNIPPETS.map(s => (
                                            <button key={s.label} type="button" onClick={() => insertSnippet(s.code)}
                                                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-cyan-500/30 text-text-muted hover:text-cyan-400 rounded-md text-[11px] font-mono transition-all"
                                                title={`Insert ${s.label}`}>
                                                {s.icon} {s.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <textarea ref={textareaRef} value={form.htmlContent} onChange={e => setForm(f => ({ ...f, htmlContent: e.target.value }))}
                                    placeholder="<h1>Hello from AntiAI.me</h1><p>Your email content here...</p>"
                                    rows={12} required
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-text-primary font-mono text-xs placeholder-text-muted focus:outline-none focus:border-cyan-500/50 resize-y" />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-between items-center pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <button type="button" onClick={() => { if (form.htmlContent) openPreviewWindow(form.htmlContent) }}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-text-secondary rounded-lg text-sm transition-colors">
                                        <Eye className="w-4 h-4" /> Preview
                                    </button>
                                    <div className="flex items-center gap-1.5 ml-2">
                                        <input type="email" value={testEmail} onChange={e => setTestEmail(e.target.value)}
                                            placeholder="your@email.com"
                                            className="w-44 bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-text-primary placeholder-text-muted focus:outline-none focus:border-amber-500/50" />
                                        <button type="button" onClick={handleSendTest}
                                            disabled={isSendingTest || !testEmail.includes('@') || !form.htmlContent}
                                            className="flex items-center gap-1.5 px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 rounded-lg text-xs font-medium transition-colors disabled:opacity-30">
                                            {isSendingTest ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SendHorizonal className="w-3.5 h-3.5" />}
                                            Send Test
                                        </button>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button type="button" onClick={() => setShowEditor(false)}
                                        className="px-4 py-2 bg-white/5 hover:bg-white/10 text-text-primary rounded-lg text-sm font-medium transition-colors">Cancel</button>
                                    <button type="submit"
                                        className="px-6 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 rounded-lg text-sm font-bold transition-colors">
                                        {editingCampaign ? 'Save Changes' : 'Create Draft'}
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
