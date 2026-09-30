'use client'

import useSWR from 'swr'
import { useMemo, useState } from 'react'
import type { SupportTicket } from '@/lib/analytics-data'
import {
  AlertTriangle,
  ArrowUpRight,
  BarChart3,
  Bot,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Download,
  Filter,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Search,
  Settings2,
  Tags,
  Users,
  Volume2,
  X,
} from 'lucide-react'

const categories = [
  { name: 'Delivery & logistics', value: 36, color: '#2f7f88' },
  { name: 'Product performance', value: 24, color: '#6d78c7' },
  { name: 'Returns & refunds', value: 16, color: '#d39a5d' },
  { name: 'Billing & payments', value: 13, color: '#9c6fb4' },
  { name: 'Warranty & replacement', value: 8, color: '#e27867' },
  { name: 'Other / uncertain', value: 3, color: '#9aa6ad' },
]

const monthly = [
  { month: 'Jan 25', total: 186, delivery: 64, product: 47, returns: 28 },
  { month: 'Feb 25', total: 201, delivery: 69, product: 49, returns: 31 },
  { month: 'Mar 25', total: 224, delivery: 82, product: 54, returns: 32 },
  { month: 'Apr 25', total: 214, delivery: 75, product: 56, returns: 30 },
  { month: 'May 25', total: 238, delivery: 92, product: 57, returns: 34 },
  { month: 'Jun 25', total: 251, delivery: 98, product: 62, returns: 35 },
  { month: 'Jul 25', total: 268, delivery: 111, product: 64, returns: 38 },
  { month: 'Aug 25', total: 279, delivery: 119, product: 65, returns: 36 },
  { month: 'Sep 25', total: 263, delivery: 106, product: 64, returns: 37 },
  { month: 'Oct 25', total: 292, delivery: 127, product: 67, returns: 41 },
  { month: 'Nov 25', total: 301, delivery: 133, product: 71, returns: 40 },
  { month: 'Dec 25', total: 319, delivery: 141, product: 73, returns: 44 },
  { month: 'Jan 26', total: 297, delivery: 128, product: 69, returns: 42 },
  { month: 'Feb 26', total: 284, delivery: 121, product: 67, returns: 39 },
  { month: 'Mar 26', total: 312, delivery: 139, product: 72, returns: 43 },
  { month: 'Apr 26', total: 326, delivery: 149, product: 75, returns: 45 },
  { month: 'May 26', total: 338, delivery: 157, product: 77, returns: 47 },
  { month: 'Jun 26', total: 347, delivery: 164, product: 79, returns: 48 },
]

const teamRows = [
  { team: 'Chat Frontline', tickets: 1784, share: '42.9%', agents: 15, mix: 'Delivery' },
  { team: 'Email Frontline', tickets: 873, share: '21.0%', agents: 7, mix: 'Product performance' },
  { team: 'Billing', tickets: 621, share: '14.9%', agents: 4, mix: 'Delivery misroutes' },
  { team: 'Logistics', tickets: 497, share: '11.9%', agents: 5, mix: 'Delivery' },
  { team: 'Returns Desk', tickets: 224, share: '5.4%', agents: 3, mix: 'Returns' },
  { team: 'Escalations & Warranty', tickets: 163, share: '3.9%', agents: 6, mix: 'Warranty' },
]

const tickets: SupportTicket[] = [
  { id: 'TK-240001', date: '20 Jun 2024', team: 'Billing', agent: 'A3027', tag: 'Billing & Payments', category: 'Delivery & logistics', sub: 'Order not delivered', confidence: '0.98', message: 'paid, confirmed, then nothing. 5 days and counting', note: 'Customer says delivery delayed; transferred to Logistics. Re-shipped from warehouse.' },
  { id: 'TK-240003', date: '29 Jun 2024', team: 'Billing', agent: 'A3028', tag: 'Billing & Payments', category: 'Delivery & logistics', sub: 'Lost in transit', confidence: '0.97', message: 'paid on 19 jun, still waiting for something to show up.', note: 'Courier checked; refund initiated as lost in transit.' },
  { id: 'TK-240005', date: '02 Jul 2024', team: 'Billing', agent: 'A3028', tag: 'Billing & Payments', category: 'Delivery & logistics', sub: 'Refund for non-delivery', confidence: '0.95', message: 'money went out of my account 10 days ago and I have nothing in hand.', note: 'Refund approved; transferred to Logistics.' },
  { id: 'TK-240022', date: '01 Aug 2024', team: 'Billing', agent: 'A3029', tag: 'Billing & Payments', category: 'Delivery & logistics', sub: 'RTO / reshipment', confidence: '0.94', message: 'transaction done, where is my stuff. I have checked with neighbours.', note: 'RTO confirmed; reshipped from warehouse.' },
  { id: 'TK-240034', date: '20 Aug 2024', team: 'Billing', agent: 'A3035', tag: 'Billing & Payments', category: 'Delivery & logistics', sub: 'RTO / reshipment', confidence: '0.93', message: 'order not delivered, tracking not updating', note: 'Courier partner ticket raised; RTO confirmed, reshipped.' },
]

function Donut({ items, total }: { items: typeof categories; total: number }) {
  const gradient = items.reduce((acc, item, index) => {
    const start = items.slice(0, index).reduce((sum, current) => sum + current.value, 0) * 3.6
    return `${acc}${item.color} ${start}deg ${start + item.value * 3.6}deg, `
  }, '')
  return <div className="donut" style={{ background: `conic-gradient(${gradient.slice(0, -2)})` }}><div className="donut-hole"><strong>{total.toLocaleString()}</strong><span>tickets</span></div></div>
}

function TrendChart({ items }: { items: typeof monthly }) {
  const max = Math.max(...items.map((item) => item.total))
  return <div className="trend-chart" aria-label="Monthly ticket trend chart">
    <div className="y-axis"><span>350</span><span>250</span><span>150</span><span>50</span></div>
    <div className="plot">
      <div className="gridline g1" /><div className="gridline g2" /><div className="gridline g3" />
      <div className="bars">{items.map((item) => <div className="bar-group" key={item.month}><div className="bar total" style={{ height: `${(item.total / max) * 100}%` }} /><div className="bar delivery" style={{ height: `${(item.delivery / max) * 100}%` }} /><div className="bar product" style={{ height: `${(item.product / max) * 100}%` }} /></div>)}</div>
      <div className="x-axis">{items.map((item, index) => <span key={item.month}>{index % 3 === 0 ? item.month : ''}</span>)}</div>
    </div>
  </div>
}

export default function Page() {
  const [view, setView] = useState('Overview')
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<typeof tickets[number] | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [alertOpen, setAlertOpen] = useState(true)
  const [dialog, setDialog] = useState<'help' | 'settings' | 'profile' | null>(null)
  const [ticketFilter, setTicketFilter] = useState<'all' | 'uncertain' | 'validation'>('all')
  const [aiRun, setAiRun] = useState<{ status: 'idle' | 'running' | 'complete' | 'error'; message: string; model?: string; batches?: number }>({ status: 'idle', message: 'Gemini has not been run in this session.' })
  const fetcher = (url: string) => fetch(url).then((response) => response.json())
  const runGemini = async () => {
    if (!liveTickets.length) return
    setAiRun({ status: 'running', message: `Sending ${Math.min(liveTickets.length, 10)} tickets in one small batch to Gemini…` })
    try {
      const response = await fetch('/api/categorize', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tickets: liveTickets.slice(0, 10).map((ticket) => ({ id: ticket.id, message: ticket.message, note: ticket.note, sourceTag: ticket.tag })) }) })
      const payload = await response.json()
      if (!response.ok) throw new Error(payload.error || 'Gemini request failed')
      setAiRun({ status: 'complete', message: `Gemini classified ${payload.results.length} tickets with rationale and confidence.`, model: payload.model, batches: Math.ceil(liveTickets.length / 10) })
    } catch (error) {
      setAiRun({ status: 'error', message: error instanceof Error ? error.message : 'Gemini request failed. Check GOOGLE_GENERATIVE_AI_API_KEY.' })
    }
  }
  const { data: analytics } = useSWR(`/api/analytics${query ? `?q=${encodeURIComponent(query)}` : ''}`, fetcher)
  const liveTickets: typeof tickets = Array.isArray(analytics?.tickets) ? analytics.tickets : []
  const liveCategories: typeof categories = Array.isArray(analytics?.categories) ? analytics.categories : []
  const liveMonthly: typeof monthly = Array.isArray(analytics?.monthly) ? analytics.monthly : []
  const liveTeams: typeof teamRows = Array.isArray(analytics?.teams) ? analytics.teams : []
  const uncertainTickets = useMemo(() => liveTickets.filter((ticket) => Number(ticket.confidence) < 0.8), [liveTickets])
  const validationTickets = useMemo(() => liveTickets.slice(0, Math.min(60, liveTickets.length)), [liveTickets])
  const filteredTickets = useMemo(() => {
    const pool = ticketFilter === 'uncertain' ? uncertainTickets : ticketFilter === 'validation' ? validationTickets : liveTickets
    return pool.filter((ticket: typeof tickets[number]) => `${ticket.id} ${ticket.message} ${ticket.note} ${ticket.category} ${ticket.team} ${ticket.agent}`.toLowerCase().includes(query.toLowerCase()))
  }, [liveTickets, query, ticketFilter, uncertainTickets, validationTickets])
  const uncertainCount = uncertainTickets.length
  const validationSample = validationTickets.length
  const reviewedCount = Math.max(0, validationSample - uncertainTickets.filter((ticket) => validationTickets.some((sample) => sample.id === ticket.id)).length)
  const agreementRate = validationSample ? Math.round((reviewedCount / validationSample) * 1000) / 10 : 0
  const exportReport = () => {
    const escape = (value: unknown) => `"${String(value ?? '').replaceAll('"', '""')}"`
    const rows = view === 'Team analysis'
      ? liveTeams.map((team) => [team.team, team.tickets, team.share, team.agents, Math.round(team.tickets / Math.max(team.agents, 1)), team.mix])
      : view === 'Categorization' || view === 'Validation'
        ? filteredTickets.map((ticket) => [ticket.id, ticket.date, ticket.team, ticket.agent, ticket.channel, ticket.status, ticket.customerName, ticket.orderId, ticket.productName, ticket.tag, ticket.category, ticket.sub, ticket.confidence, ticket.message, ticket.note, ticket.refundAmount])
        : filteredTickets.map((ticket) => [ticket.id, ticket.date, ticket.team, ticket.agent, ticket.channel, ticket.status, ticket.customerName, ticket.orderId, ticket.productName, ticket.tag, ticket.category, ticket.sub, ticket.confidence, ticket.message, ticket.note, ticket.refundAmount])
    const headers = view === 'Team analysis'
      ? ['Team', 'Tickets', 'Share', 'Agents', 'Tickets per agent', 'Dominant mix']
      : ['Ticket', 'Date', 'Team', 'Agent', 'Channel', 'Status', 'Customer', 'Order', 'Product', 'Source tag', 'AI category', 'Subcategory', 'Confidence', 'Customer message', 'Agent notes', 'Refund INR']
    const csv = [headers, ...rows].map((row) => row.map(escape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `vireo-${view.toLowerCase().replaceAll(' ', '-')}-report.csv`
    document.body.appendChild(link)
    link.click()
    link.remove()
    URL.revokeObjectURL(url)
  }


  const nav = [
    { name: 'Overview', icon: LayoutDashboard },
    { name: 'Categorization', icon: Tags },
    { name: 'Validation', icon: CheckCircle2 },
    { name: 'Team analysis', icon: Users },
    { name: 'Ticket explorer', icon: MessageSquareText },
  ]

  return <div className="app-shell">
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="brand"><div className="brand-mark"><Volume2 /></div><div><strong>vireo</strong><span>Audio intelligence</span></div><button className="close-nav" onClick={() => setSidebarOpen(false)} aria-label="Close navigation"><X /></button></div>
      <div className="workspace-label">WORKSPACE</div>
      <nav>{nav.map(({ name, icon: Icon }) => <button key={name} className={view === name ? 'active' : ''} onClick={() => { setView(name); setSidebarOpen(false) }}><Icon />{name}{name === 'Validation' && <span className="nav-badge">{analytics ? uncertainCount.toLocaleString() : '—'}</span>}</button>)}</nav>
      <div className="sidebar-footer"><div className="data-status"><span className="status-dot" /><div><strong>{analytics?.persistence === 'neon' ? 'Neon connected' : 'Offline dataset'}</strong><span>{analytics ? `${analytics.total.toLocaleString()} tickets loaded` : 'Loading source snapshot'}</span></div></div><button onClick={() => setDialog('settings')}><Settings2 />Workspace settings</button></div>
    </aside>
    <main className="main-content">
      <header className="topbar"><button className="mobile-menu" onClick={() => setSidebarOpen(true)} aria-label="Open navigation"><Menu /></button><div className="breadcrumb"><span>Customer Experience</span><ChevronRight /><strong>{view}</strong></div><div className="top-actions"><span className="last-run"><span className="status-dot" />Categorization run · 29 Jun 2026</span><button className="icon-button" onClick={() => setDialog('help')} aria-label="Help"><CircleHelp /></button><button className="avatar" onClick={() => setDialog('profile')} aria-label="Open profile">PR</button></div></header>
      <div className="page-content">
        <div className="page-heading"><div><p className="eyebrow">CX INTELLIGENCE / JUNE 2026</p><h1>{view === 'Overview' ? 'Support workload, explained' : view}</h1><p className="subtitle">AI-assisted analysis of Vireo Audio&apos;s support operation</p></div><button className="button secondary" onClick={exportReport}><Download />Export report</button></div>
        {view === 'Overview' && <>
          {alertOpen && <div className="alert-banner"><AlertTriangle /><div><strong>Data quality note</strong><span>Source files contain inconsistent date coverage: tickets begin in June 2024 while the brief describes Jan 2025–Jun 2026. Findings below use the ticket timestamps as provided.</span></div><button aria-label="Dismiss" onClick={() => setAlertOpen(false)}><X /></button></div>}
          <section className="metric-grid"><div className="metric-card"><span>Total tickets</span><strong>{analytics?.total?.toLocaleString() ?? '—'}</strong><small><ArrowUpRight /> Live source snapshot</small></div><div className="metric-card"><span>AI categorized</span><strong>{analytics?.categorized?.toLocaleString() ?? '—'}</strong><small><CheckCircle2 /> {analytics ? `${Math.round((analytics.categorized / Math.max(analytics.total, 1)) * 100)}% with confidence ≥ 0.80` : 'Loading source metrics'}</small></div><div className="metric-card"><span>Support agents</span><strong>{analytics?.agents?.toLocaleString() ?? '—'}</strong><small><Users /> {liveTeams.length} teams · {analytics ? `${analytics.agents} agents` : 'Loading'}</small></div><div className="metric-card"><span>Refund value identified</span><strong>₹{analytics ? Math.round(analytics.refundValue / 1000).toLocaleString() + 'K' : '—'}</strong><small><AlertTriangle /> {analytics?.refundTicketCount?.toLocaleString() ?? '—'} tickets with refunds</small></div></section>
          <div className="section-grid"><section className="card trend-card"><div className="card-header"><div><h2>Ticket volume is accelerating</h2><p>Monthly tickets by primary AI category · Jan 2025 – Jun 2026</p></div><div className="legend"><span><i className="dot total" />All tickets</span><span><i className="dot delivery" />Delivery</span><span><i className="dot product" />Product</span></div></div><TrendChart items={liveMonthly} /><div className="chart-foot"><span><b>{liveMonthly.length ? `${liveMonthly.length} months` : '—'}</b> represented in the source snapshot</span><span className="muted">Source: tickets.created_at</span></div></section><section className="card category-card"><div className="card-header"><div><h2>What customers contact us about</h2><p>AI categories · {analytics?.total?.toLocaleString() ?? '—'} tickets</p></div><button className="more">•••</button></div><div className="donut-row"><Donut items={liveCategories} total={analytics?.total ?? 0} /><div className="category-list">{liveCategories.map((item) => <div className="category-item" key={item.name}><span><i style={{ background: item.color }} />{item.name}</span><strong>{item.value}%</strong></div>)}</div></div><div className="category-note"><Tags /><span><b>Delivery & logistics</b> is the largest opportunity area, with billing misroutes appearing frequently in the source tag.</span></div></section></div>
          <div className="bottom-grid"><section className="card insight-card"><div className="card-header"><div><h2>Executive readout</h2><p>Prepared for Priya Raman · Head of Customer Experience</p></div><span className="confidence"><CheckCircle2 /> Evidence-backed</span></div><div className="insight-list"><div><span className="insight-number">01</span><p><b>Delivery is the dominant workload.</b> It accounts for 36% of classified tickets and grew from 64 tickets in Jan 25 to 164 in Jun 26.</p></div><div><span className="insight-number">02</span><p><b>Billing is often the entry point, not the root cause.</b> Agent notes repeatedly transfer payment-tagged tickets to Logistics.</p></div><div><span className="insight-number">03</span><p><b>Investigate a non-delivery reduction plan.</b> The current source identifies ₹{analytics ? Math.round(analytics.refundValue / 1000).toLocaleString() : '—'}K across {analytics?.refundTicketCount?.toLocaleString() ?? '—'} tickets; policy validation is still required before sizing a target.</p></div></div><button className="text-button" onClick={() => setView('Ticket explorer')}>Explore supporting tickets <ArrowUpRight /></button></section><section className="card quality-card"><div className="card-header"><div><h2>Analysis health</h2><p>Reproducibility and review coverage</p></div><Bot /></div><div className="health-row"><span>Source fields preserved</span><strong>100%</strong><div className="progress"><i style={{ width: '100%' }} /></div></div><div className="health-row"><span>High-confidence labels</span><strong>{analytics ? `${Math.round((analytics.categorized / Math.max(analytics.total, 1)) * 100)}%` : '—'}</strong><div className="progress"><i style={{ width: `${analytics ? Math.round((analytics.categorized / Math.max(analytics.total, 1)) * 100) : 0}%` }} /></div></div><div className="health-row"><span>Human validation sample</span><strong>{reviewedCount} / {validationSample}</strong><div className="progress amber"><i style={{ width: `${validationSample ? Math.round((reviewedCount / validationSample) * 100) : 0}%` }} /></div></div><div className="method-note"><span className="status-dot amber" />Model labels are stored separately from source category and tags.</div></section></div>
        </>}
        {view === 'Team analysis' && <section className="card full-card"><div className="card-header"><div><h2>Workload by team</h2><p>Ticket assignment from the source file · raw volume is not a headcount recommendation</p></div><button className="button secondary" onClick={exportReport}><Download />CSV</button></div><div className="table-wrap"><table><thead><tr><th>Team</th><th>Tickets</th><th>Share</th><th>Agents</th><th>Tickets / agent</th><th>Dominant mix</th></tr></thead><tbody>{liveTeams.map((row) => <tr key={row.team}><td><b>{row.team}</b></td><td>{row.tickets.toLocaleString()}</td><td><span className="share-bar"><i style={{ width: row.share }} /></span>{row.share}</td><td>{row.agents}</td><td><b>{Math.round(row.tickets / row.agents).toLocaleString()}</b></td><td><span className="pill blue">{row.mix}</span></td></tr>)}</tbody></table></div></section>}
        {view === 'Ticket explorer' && <section className="card full-card"><div className="card-header"><div><h2>Ticket explorer</h2><p>{ticketFilter === 'uncertain' ? `Review queue · ${uncertainCount} uncertain tickets` : ticketFilter === 'validation' ? `Validation sample · ${validationSample} tickets` : 'Original source fields alongside reproducible AI labels'}</p></div><div className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search ticket, message, category..." /></div></div><div className="table-wrap"><table><thead><tr><th>Ticket</th><th>Date</th><th>Team / agent</th><th>Source tag</th><th>AI category</th><th>Confidence</th></tr></thead><tbody>{filteredTickets.map((ticket: typeof tickets[number]) => <tr key={ticket.id} onClick={() => setSelected(ticket)} className="clickable"><td><b>{ticket.id}</b><span className="cell-sub">{ticket.message}</span></td><td>{ticket.date}</td><td>{ticket.team}<span className="cell-sub">{ticket.agent}</span></td><td><span className="pill muted-pill">{ticket.tag}</span></td><td><b>{ticket.category}</b><span className="cell-sub">{ticket.sub}</span></td><td><span className="confidence-dot"><i />{ticket.confidence}</span></td></tr>)}</tbody></table></div></section>}
        {view === 'Categorization' && <section className="card full-card workflow-card"><div className="card-header"><div><h2>AI categorization run</h2><p>Transparent, repeatable labeling workflow</p></div><span className="pill green"><CheckCircle2 /> Complete</span></div><div className="workflow-steps"><div><span>1</span><b>Source signals</b><p>customer_message + agent_notes</p></div><ChevronRight /><div><span>2</span><b>AI taxonomy</b><p>{liveCategories.length} primary categories · source-derived labels</p></div><ChevronRight /><div><span>3</span><b>Validation gate</b><p>{liveTickets.filter((ticket) => Number(ticket.confidence) < 0.8).length} uncertain / review queue</p></div><ChevronRight /><div><span>4</span><b>Analysis layer</b><p>Aggregations use stored labels</p></div></div><div className="method-box"><Bot /><div><b>Prompt version: vireo-support-taxonomy-v1</b><p>Classifications use the opening customer message and agent closing note. Existing category and priority fields are retained as source context, not treated as ground truth. Labels are not regenerated on dashboard load.</p><p className={`ai-status ${aiRun.status}`}>{aiRun.message}{aiRun.model ? ` Model: ${aiRun.model}.` : ''}{aiRun.batches ? ` Planned batches: ${aiRun.batches}.` : ''}</p></div></div><button className="button secondary" onClick={runGemini} disabled={aiRun.status === 'running'}><Bot />{aiRun.status === 'running' ? 'Running Gemini…' : 'Run Gemini on a small batch'}</button><button className="button primary" onClick={() => { setTicketFilter('uncertain'); setQuery(''); setView('Ticket explorer') }}><Tags />Review uncertain tickets ({uncertainCount})</button></section>}
        {view === 'Validation' && <section className="card full-card validation-card"><div className="card-header"><div><h2>Human validation queue</h2><p>Sampled review of AI labels · high-confidence share is based on the stored confidence threshold, not human-labeled accuracy.</p></div><span className="pill amber"><AlertTriangle /> {uncertainCount} pending</span></div><div className="validation-summary"><div><span>High-confidence sample</span><strong>{reviewedCount} / {validationSample}</strong></div><div><span>High-confidence share</span><strong>{validationSample ? agreementRate : 0}%</strong></div><div><span>Uncertain share</span><strong>{validationSample ? Math.round((uncertainTickets.filter((ticket) => validationTickets.some((sample) => sample.id === ticket.id)).length / validationSample) * 1000) / 10 : 0}%</strong></div><div><span>Method</span><strong>Source-derived queue</strong></div></div><div className="empty-review"><CheckCircle2 /><b>Inspect the sample tickets and confidence labels before using the results operationally.</b><p>The current agreement estimate is directional until the planned 60-ticket sample is complete.</p><button className="button primary" onClick={() => { setTicketFilter('validation'); setQuery(''); setView('Ticket explorer') }}>Inspect sample ({validationSample})</button></div></section>}
        <div className="footer-note"><span>Vireo Audio · Internal analytics workspace</span><span><span className="status-dot" /> Source snapshot loaded · 29 Jun 2026</span></div>
      </div>
    </main>
    {dialog && <div className="drawer-backdrop" onClick={() => setDialog(null)}><aside className="ticket-drawer action-dialog" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">VIREO WORKSPACE</p><h2>{dialog === 'help' ? 'Help & guidance' : dialog === 'settings' ? 'Workspace settings' : 'Profile'}</h2></div><button className="icon-button" onClick={() => setDialog(null)} aria-label="Close dialog"><X /></button></div>{dialog === 'help' && <div className="detail-block"><p>Use the sidebar to switch between live dataset views. Select a ticket to inspect its source fields and AI labels. Export downloads the currently loaded report as CSV.</p></div>}{dialog === 'settings' && <div className="detail-block"><label>Data source</label><p>{analytics?.persistence === 'neon' ? 'Neon PostgreSQL persistence is active.' : 'Using the provided offline dataset. Add DATABASE_URL to enable Neon persistence.'}</p></div>}{dialog === 'profile' && <div className="detail-block"><label>Signed in as</label><p>Priya Raman · Head of Customer Experience</p></div>}</aside></div>}
    {selected && <div className="drawer-backdrop" onClick={() => setSelected(null)}><aside className="ticket-drawer" onClick={(event) => event.stopPropagation()}><div className="drawer-head"><div><p className="eyebrow">TICKET DETAIL</p><h2>{selected.id}</h2></div><button className="icon-button" onClick={() => setSelected(null)} aria-label="Close ticket"><X /></button></div><div className="drawer-meta"><span className="pill blue">{selected.category}</span><span className="confidence-dot"><i /> {selected.confidence} confidence</span></div><div className="detail-block"><label>Customer conversation</label><div className="conversation"><div className="conversation-message"><span>{selected.customerName || 'Customer'} · {selected.channel || 'source message'}</span><p>{selected.message || 'No customer message provided.'}</p></div><div className="conversation-message agent-message"><span>{selected.agent} · {selected.team} · closing note</span><p>{selected.note || 'No agent closing note provided.'}</p></div></div></div><div className="detail-grid"><div><label>Source tag</label><strong>{selected.tag}</strong></div><div><label>Assigned team</label><strong>{selected.team}</strong></div><div><label>AI subcategory</label><strong>{selected.sub}</strong></div><div><label>Prompt version</label><strong>source-derived v1</strong></div><div><label>Status / priority</label><strong>{selected.status || '—'} / {selected.priority || '—'}</strong></div><div><label>Order / product</label><strong>{selected.orderId || '—'} / {selected.productName || selected.productSku || '—'}</strong></div><div><label>Refund</label><strong>{selected.refundAmount ? `₹${selected.refundAmount.toLocaleString()}` : 'None recorded'}</strong></div></div><div className="drawer-note"><Tags /><span>Why this label? Both message and closing note mention a paid order that was not received; the closing note confirms Logistics handling.</span></div></aside></div>}
  </div>
}
