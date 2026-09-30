import { neon } from '@neondatabase/serverless'
import { readFile } from 'node:fs/promises'
import path from 'node:path'

export type SupportTicket = {
  id: string
  date: string
  team: string
  agent: string
  tag: string
  category: string
  sub: string
  confidence: string
  message: string
  note: string
  sourceSystem?: string
  refundAmount?: number
  status?: string
  channel?: string
  customerName?: string
  orderId?: string
  productName?: string
  productSku?: string
  priority?: string
}

function parseCsv(input: string) {
  const rows: string[][] = []; let row: string[] = []; let cell = ''; let quoted = false
  for (let i = 0; i < input.length; i++) {
    const char = input[i]; const next = input[i + 1]
    if (char === '"' && quoted && next === '"') { cell += '"'; i++ }
    else if (char === '"') quoted = !quoted
    else if (char === ',' && !quoted) { row.push(cell); cell = '' }
    else if ((char === '\n' || char === '\r') && !quoted) { if (char === '\n' && (cell || row.length)) { row.push(cell); rows.push(row); row = []; cell = '' } }
    else cell += char
  }
  if (cell || row.length) { row.push(cell); rows.push(row) }
  const headers = rows.shift()?.map((header) => header.trim()) ?? []
  return rows.filter((values) => values.length === headers.length).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index].trim()])))
}

async function readDataset(name: string) {
  try { return parseCsv(await readFile(path.join(process.cwd(), 'data', name), 'utf8')) } catch { return [] }
}

function formatDate(value: string) {
  const date = new Date(value); return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

async function loadOfflineTickets(): Promise<SupportTicket[]> {
  const [ticketRows, customers, orders, products, agents] = await Promise.all(['tickets.csv', 'customers.csv', 'orders.csv', 'products.csv', 'agents.csv'].map(readDataset))
  const customerById = new Map(customers.map((row) => [row.customer_id, row]))
  const orderById = new Map(orders.map((row) => [row.order_id, row]))
  const ordersByCustomer = new Map<string, Record<string, string>[]>()
  for (const order of orders) {
    const customerOrders = ordersByCustomer.get(order.customer_id) ?? []
    customerOrders.push(order)
    ordersByCustomer.set(order.customer_id, customerOrders)
  }
  const productBySku = new Map(products.map((row) => [row.sku, row]))
  const agentById = new Map(agents.map((row) => [row.agent_id, row]))
  return ticketRows.map((row) => {
    const customer = customerById.get(row.customer_id)
    const customerOrders = ordersByCustomer.get(row.customer_id) ?? []
    const order = orderById.get(row.order_id) ?? customerOrders.find((candidate) => candidate.sku === row.product_sku) ?? customerOrders[0]
    const productSku = row.product_sku || order?.sku
    const product = productSku ? productBySku.get(productSku) : undefined
    const agent = agentById.get(row.agent_id)
    const message = row.customer_message || 'No customer message provided.'
    const note = row.agent_notes || 'No agent note provided.'
    const text = `${message} ${note}`.toLowerCase()
    const signals = [
      { category: 'Returns & refunds', terms: ['refund', 'return', 'rto', 'money back'] },
      { category: 'Billing & payments', terms: ['billing', 'paid', 'payment', 'charged', 'transaction'] },
      { category: 'Delivery & logistics', terms: ['deliver', 'tracking', 'transit', 'courier', 'shipment', 'not received', 'not delivered'] },
      { category: 'Warranty & replacement', terms: ['warranty', 'replace', 'replacement', 'repair', 'defect'] },
      { category: 'Product performance', terms: ['battery', 'sound', 'audio', 'connect', 'bluetooth', 'quality'] },
    ].map((signal) => ({ ...signal, score: signal.terms.filter((term) => text.includes(term)).length }))
    const ranked = signals.sort((a, b) => b.score - a.score)
    const top = ranked[0]
    const second = ranked[1]
    const category = top.score > 0 ? top.category : 'Other / uncertain'
    const confidence = top.score === 0 ? 0.45 : top.score === 1 || top.score === second?.score ? 0.68 : top.score >= 3 ? 0.92 : 0.82
    return { id: row.ticket_id, date: formatDate(row.created_at), team: row.assigned_team || agent?.team || 'Unassigned', agent: row.agent_id || 'Unassigned', tag: row.category || 'Uncategorized', category, sub: row.refund_reason_code || row.status || 'Unclassified', confidence: confidence.toFixed(2), message: message, note, sourceSystem: row.source_system || 'provided export', refundAmount: Number(row.refund_amount_inr || 0), status: row.status, channel: row.channel, customerName: customer?.name, orderId: order?.order_id || row.order_id, productName: product?.product_name, productSku, priority: row.priority } satisfies SupportTicket
  })
}

export async function getAnalytics(query = '') {
  let source = await loadOfflineTickets(); const databaseUrl = process.env.DATABASE_URL
  if (databaseUrl) { try { const sql = neon(databaseUrl); source = await sql`select ticket_id as id, to_char(created_at, 'DD Mon YYYY') as date, assigned_team as team, agent_id as agent, category as tag, category, coalesce(refund_reason_code, status, 'Unclassified') as sub, '0.80' as confidence, customer_message as message, agent_notes as note, source_system as "sourceSystem", coalesce(refund_amount_inr, 0) as "refundAmount", status, channel from support_tickets order by created_at desc, ticket_id` as SupportTicket[] } catch (error) { console.warn('[v0] Neon unavailable; using supplied offline datasets', error) } }
  const normalized = query.trim().toLowerCase(); const filtered = normalized ? source.filter((ticket) => Object.values(ticket).join(' ').toLowerCase().includes(normalized)) : source
  const categoryCounts = source.reduce<Record<string, number>>((counts, ticket) => { counts[ticket.category] = (counts[ticket.category] || 0) + 1; return counts }, {})
  const colors = ['#2f7f88', '#6d78c7', '#d39a5d', '#9c6fb4', '#e27867', '#9aa6ad']; const categories = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1]).map(([name, count], index) => ({ name, value: Math.round(count / Math.max(source.length, 1) * 100), count, color: colors[index % colors.length] }))
  const monthlyCounts = source.reduce<Record<string, { total: number; delivery: number; product: number; returns: number }>>((months, ticket) => { const key = ticket.date.slice(3); const current = months[key] || { total: 0, delivery: 0, product: 0, returns: 0 }; current.total++; if (ticket.category.includes('Delivery')) current.delivery++; if (ticket.category.includes('Product')) current.product++; if (ticket.category.includes('Returns')) current.returns++; months[key] = current; return months }, {})
  const monthly = Object.entries(monthlyCounts).map(([month, values]) => ({ month, ...values })).slice(-18)
  const teamCounts = source.reduce<Record<string, { tickets: number; agents: Set<string>; categories: Record<string, number> }>>((teams, ticket) => { const current = teams[ticket.team] || { tickets: 0, agents: new Set<string>(), categories: {} }; current.tickets++; current.agents.add(ticket.agent); current.categories[ticket.category] = (current.categories[ticket.category] || 0) + 1; teams[ticket.team] = current; return teams }, {})
  const teams = Object.entries(teamCounts).sort((a, b) => b[1].tickets - a[1].tickets).map(([team, values]) => ({ team, tickets: values.tickets, share: `${Math.round(values.tickets / Math.max(source.length, 1) * 1000) / 10}%`, agents: values.agents.size, mix: Object.entries(values.categories).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unclassified' }))
  return { tickets: filtered, total: source.length, categorized: source.filter((ticket) => Number(ticket.confidence) >= 0.8).length, agents: new Set(source.map((ticket) => ticket.agent)).size, refundTicketCount: source.filter((ticket) => (ticket.refundAmount ?? 0) > 0).length, refundValue: source.reduce((sum, ticket) => sum + (ticket.refundAmount ?? 0), 0), categories, monthly, teams, sourceSystem: source[0]?.sourceSystem || 'provided export', loadedAt: new Date().toISOString(), persistence: databaseUrl ? 'neon' : 'offline' }
}

export async function saveTicket(ticket: SupportTicket) { if (!process.env.DATABASE_URL) return { persisted: false, ticket }; const sql = neon(process.env.DATABASE_URL); await sql`insert into support_tickets (ticket_id, created_at, assigned_team, agent_id, category, customer_message, agent_notes, source_system, refund_amount_inr) values (${ticket.id}, ${ticket.date}::date, ${ticket.team}, ${ticket.agent}, ${ticket.tag}, ${ticket.message}, ${ticket.note}, ${ticket.sourceSystem}, ${ticket.refundAmount}) on conflict (ticket_id) do update set category=excluded.category, agent_notes=excluded.agent_notes, refund_amount_inr=excluded.refund_amount_inr`; return { persisted: true, ticket } }
export function isNeonConfigured() { return Boolean(process.env.DATABASE_URL) }
export function getOfflineSource() { return 'data/tickets.csv + customers.csv + orders.csv + products.csv + agents.csv' }
export type AnalyticsResult = Awaited<ReturnType<typeof getAnalytics>>
export const sourceDescription = 'Provided support, customer, order, product, and agent exports with optional Neon persistence'
export function getDataMode() { return process.env.DATABASE_URL ? 'neon' : 'offline' }
export const datasetFile = 'data/'
export const schemaVersion = 2

export const tickets: SupportTicket[] = []
export const offlineSummary = { total: 0, categorized: 0, agents: 0, refundTicketCount: 0, refundValue: 0 }
export async function getTicketCount() { return (await getAnalytics()).total }
export function normalizeTicket(ticket: SupportTicket) { return ticket }

export function getSqlSchema() { return `create table if not exists support_tickets (ticket_id text primary key, created_at timestamp not null, assigned_team text, agent_id text, category text, customer_message text, agent_notes text, source_system text, refund_amount_inr numeric default 0);` }
