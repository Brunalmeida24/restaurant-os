"use client"

import { useMemo } from "react"

interface MenuItemRef {
  name: string
  emoji: string
}

interface OrderItemRow {
  quantity: number
  unit_price: number
  menu_items: MenuItemRef | MenuItemRef[]
}

interface PaidOrder {
  id: string
  total_amount: number
  closed_at: string
  order_items: OrderItemRow[]
}

interface TableRow {
  status: string
}

interface OpenOrderRow {
  id: string
  status: string
}

interface PaymentRow {
  method: string
  amount: number
  created_at: string
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

const methodLabels: Record<string, string> = {
  credit: "Crédito",
  debit: "Débito",
  pix: "Pix",
  cash: "Dinheiro",
}

const hourLabels = Array.from({ length: 12 }, (_, i) => {
  const hour = 11 + i
  return `${hour}h`
})

function getMenuItem(menuItems: MenuItemRef | MenuItemRef[]): MenuItemRef | null {
  if (Array.isArray(menuItems)) {
    return menuItems[0] ?? null
  }
  return menuItems ?? null
}

export function DashboardClient({
  paidToday,
  tables,
  openOrders,
  paymentsToday,
}: {
  paidToday: PaidOrder[]
  tables: TableRow[]
  openOrders: OpenOrderRow[]
  paymentsToday: PaymentRow[]
}) {
  const totalRevenue = paidToday.reduce((s, o) => s + Number(o.total_amount), 0)
  const avgTicket = paidToday.length > 0 ? totalRevenue / paidToday.length : 0

  const occupiedTables = tables.filter(t => t.status === "occupied").length
  const totalTables = tables.length

  const awaitingPayment = openOrders.filter(o => o.status === "awaiting_payment" || o.status === "served").length

  // Faturamento por hora (11h às 22h)
  const revenueByHour = useMemo(() => {
    const buckets = new Array(12).fill(0)
    for (const order of paidToday) {
      const hour = new Date(order.closed_at).getHours()
      const idx = hour - 11
      if (idx >= 0 && idx < 12) {
        buckets[idx] += Number(order.total_amount)
      }
    }
    return buckets
  }, [paidToday])

  const maxHourRevenue = Math.max(...revenueByHour, 1)
  const peakHourIndex = revenueByHour.indexOf(Math.max(...revenueByHour))

  // Formas de pagamento
  const paymentBreakdown = useMemo(() => {
    const map = new Map<string, number>()
    for (const p of paymentsToday) {
      map.set(p.method, (map.get(p.method) ?? 0) + Number(p.amount))
    }
    const total = Array.from(map.values()).reduce((s, v) => s + v, 0)
    return Array.from(map.entries())
      .map(([method, value]) => ({
        method,
        label: methodLabels[method] ?? method,
        value,
        pct: total > 0 ? (value / total) * 100 : 0,
      }))
      .sort((a, b) => b.value - a.value)
  }, [paymentsToday])

  // Itens mais vendidos hoje
  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; qty: number; revenue: number }>()
    for (const order of paidToday) {
      for (const item of order.order_items) {
        const menuItem = getMenuItem(item.menu_items)
        if (!menuItem) continue
        const key = menuItem.name
        const revenue = item.quantity * Number(item.unit_price)
        const existing = map.get(key)
        if (existing) {
          existing.qty += item.quantity
          existing.revenue += revenue
        } else {
          map.set(key, { name: menuItem.name, emoji: menuItem.emoji, qty: item.quantity, revenue })
        }
      }
    }
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }, [paidToday])

  const today = new Date().toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  })

  return (
    <div className="flex-1 p-7 px-8">
      <div className="flex justify-between items-baseline mb-7">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            Dashboard
          </h1>
          <p className="text-xs mt-1 capitalize" style={{ color: "#4A4B47" }}>
            {today}
          </p>
        </div>
        <div className="flex items-center gap-[7px]">
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#34D399" }} />
          <span className="text-xs" style={{ color: "#87887F" }}>Sistema online</span>
        </div>
      </div>

      {/* KPI strip */}
      <div className="flex mb-[30px] rounded-[10px] py-5 px-6" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
        <div className="flex-1">
          <div className="text-[11px] tracking-wider mb-2.5 font-medium" style={{ color: "#4A4B47" }}>
            FATURAMENTO HOJE
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-medium" style={{ color: "#87887F" }}>R$</span>
            <span className="text-[32px] font-bold tracking-tight" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
              {totalRevenue.toFixed(2).replace(".", ",")}
            </span>
          </div>
          <div className="text-xs mt-1.5" style={{ color: "#4A4B47" }}>
            {paidToday.length} {paidToday.length === 1 ? "comanda fechada" : "comandas fechadas"}
          </div>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="text-[11px] tracking-wider mb-2.5 font-medium" style={{ color: "#4A4B47" }}>
            TICKET MÉDIO
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-base font-medium" style={{ color: "#87887F" }}>R$</span>
            <span className="text-[32px] font-bold tracking-tight" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
              {avgTicket.toFixed(2).replace(".", ",")}
            </span>
          </div>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="text-[11px] tracking-wider mb-2.5 font-medium" style={{ color: "#4A4B47" }}>
            MESAS OCUPADAS
          </div>
          <span className="text-[32px] font-bold tracking-tight" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {occupiedTables}/{totalTables}
          </span>
          <div className="text-xs mt-1.5" style={{ color: "#4A4B47" }}>
            {totalTables > 0 ? Math.round((occupiedTables / totalTables) * 100) : 0}% ocupação
          </div>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="text-[11px] tracking-wider mb-2.5 font-medium" style={{ color: "#4A4B47" }}>
            PEDIDOS ABERTOS
          </div>
          <span className="text-[32px] font-bold tracking-tight" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {openOrders.length}
          </span>
          <div className="text-xs mt-1.5" style={{ color: "#4A4B47" }}>
            {awaitingPayment} aguardando caixa
          </div>
        </div>
      </div>

      {/* Chart + payment */}
      <div className="flex gap-4 mb-4">
        <div className="rounded-[10px] p-[22px] flex-1" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
          <div className="flex justify-between items-baseline mb-[22px]">
            <span className="text-[13px] font-semibold" style={{ color: "#ECECE9" }}>
              Faturamento por hora
            </span>
            <span className="text-[11px]" style={{ color: "#4A4B47" }}>Hoje</span>
          </div>
          <div className="flex items-end gap-2" style={{ height: 130 }}>
            {revenueByHour.map((v, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full rounded-sm transition-all"
                  style={{
                    height: `${(v / maxHourRevenue) * 100}px`,
                    minHeight: 3,
                    background: i === peakHourIndex && v > 0 ? "#34D399" : "#2A2C2A",
                  }}
                />
                <span className="text-[9px]" style={{ color: "#4A4B47" }}>{hourLabels[i]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[10px] p-[22px]" style={{ background: "#1A1B1A", border: "1px solid #26272566", width: 280 }}>
          <div className="text-[13px] font-semibold mb-[18px]" style={{ color: "#ECECE9" }}>
            Formas de pagamento
          </div>
          {paymentBreakdown.length === 0 && (
            <div className="text-xs text-center py-6" style={{ color: "#4A4B47" }}>
              Nenhum pagamento hoje
            </div>
          )}
          {paymentBreakdown.map((m, i) => (
            <div key={m.method} className={i < paymentBreakdown.length - 1 ? "mb-3.5" : ""}>
              <div className="flex justify-between mb-1.5">
                <span className="text-xs" style={{ color: "#87887F" }}>{m.label}</span>
                <span className="text-xs" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
                  {fmt(m.value)}
                </span>
              </div>
              <div className="rounded-sm h-[3px]" style={{ background: "#1E1F1E" }}>
                <div
                  className="h-[3px] rounded-sm"
                  style={{ width: `${m.pct}%`, background: i === 0 ? "#34D399" : "#4A4B47" }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Top items */}
      <div className="rounded-[10px] p-[22px]" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
        <div className="text-[13px] font-semibold mb-4" style={{ color: "#ECECE9" }}>
          Itens Mais Vendidos Hoje
        </div>
        {topItems.length === 0 && (
          <div className="text-xs text-center py-8" style={{ color: "#4A4B47" }}>
            Nenhuma venda registrada hoje ainda
          </div>
        )}
        <div className="flex flex-col">
          {topItems.map((item, i) => (
            <div
              key={item.name}
              className="flex items-center gap-3.5 py-2.5"
              style={{ borderBottom: i < topItems.length - 1 ? "1px solid #1E1F1E" : "none" }}
            >
              <span className="text-xs w-4" style={{ color: "#4A4B47", fontFamily: "var(--font-mono)" }}>
                {i + 1}
              </span>
              <span className="flex-1 text-[13px]" style={{ color: "#ECECE9" }}>
                {item.emoji} {item.name}
              </span>
              <span className="text-xs" style={{ color: "#87887F" }}>{item.qty}x</span>
              <span className="text-[13px] font-semibold" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
                {fmt(item.revenue)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}