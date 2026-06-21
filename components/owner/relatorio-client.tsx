"use client"

import { useMemo, useState } from "react"
import { TrendingUp, Receipt, Clock, ChevronDown, ChevronUp } from "lucide-react"

interface OrderItemRow {
  quantity: number
  unit_price: number
  menu_items: { name: string; emoji: string }
}

interface PaidOrder {
  id: string
  closed_at: string
  total_amount: number
  discount_amount: number
  people_count: number
  tables: { number: number } | null
  profiles: { name: string } | null
  order_items: OrderItemRow[]
}

interface CashSession {
  id: string
  opening_amount: number
  closing_amount: number | null
  opened_at: string
  closed_at: string | null
  profiles: { name: string } | null
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

const periodOptions = [
  { id: "today", label: "Hoje" },
  { id: "7d", label: "7 dias" },
  { id: "30d", label: "30 dias" },
]

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString()
}

export function RelatorioClient({
  paidOrders,
  cashSessions,
}: {
  paidOrders: PaidOrder[]
  cashSessions: CashSession[]
}) {
  const [period, setPeriod] = useState("7d")
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  const filteredOrders = useMemo(() => {
    const now = new Date()
    return paidOrders.filter(o => {
      const closedAt = new Date(o.closed_at)
      if (period === "today") return isSameDay(closedAt, now)
      if (period === "7d") {
        const cutoff = new Date()
        cutoff.setDate(cutoff.getDate() - 7)
        return closedAt >= cutoff
      }
      const cutoff = new Date()
      cutoff.setDate(cutoff.getDate() - 30)
      return closedAt >= cutoff
    })
  }, [paidOrders, period])

  const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total_amount), 0)
  const totalDiscount = filteredOrders.reduce((s, o) => s + Number(o.discount_amount || 0), 0)
  const avgTicket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0

  const topItems = useMemo(() => {
    const map = new Map<string, { name: string; emoji: string; qty: number; revenue: number }>()
    for (const order of filteredOrders) {
      for (const item of order.order_items) {
        const key = item.menu_items.name
        const existing = map.get(key)
        const revenue = item.quantity * Number(item.unit_price)
        if (existing) {
          existing.qty += item.quantity
          existing.revenue += revenue
        } else {
          map.set(key, {
            name: item.menu_items.name,
            emoji: item.menu_items.emoji,
            qty: item.quantity,
            revenue,
          })
        }
      }
    }
    return Array.from(map.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8)
  }, [filteredOrders])

  const maxItemRevenue = Math.max(...topItems.map(i => i.revenue), 1)

  return (
    <div className="flex-1 p-7 px-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            Relatórios
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4B47" }}>
            Histórico de vendas e fechamentos de caixa
          </p>
        </div>
        <div className="flex gap-1.5">
          {periodOptions.map(opt => (
            <button
              key={opt.id}
              onClick={() => setPeriod(opt.id)}
              className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold"
              style={{
                background: period === opt.id ? "#34D399" : "#1A1B1A",
                color: period === opt.id ? "#0A0B0A" : "#87887F",
                border: `1px solid ${period === opt.id ? "#34D399" : "#262725"}`,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* KPI strip */}
      <div
        className="flex mb-7 rounded-[10px] py-5 px-6"
        style={{ background: "#1A1B1A", border: "1px solid #26272566" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <TrendingUp size={16} color="#34D399" />
            <span className="text-[11px] tracking-wider font-medium" style={{ color: "#87887F" }}>
              FATURAMENTO
            </span>
          </div>
          <span className="text-[28px] font-bold" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {fmt(totalRevenue)}
          </span>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <Receipt size={16} color="#60A5FA" />
            <span className="text-[11px] tracking-wider font-medium" style={{ color: "#87887F" }}>
              COMANDAS PAGAS
            </span>
          </div>
          <span className="text-[28px] font-bold" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {filteredOrders.length}
          </span>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <TrendingUp size={16} color="#E8B86D" />
            <span className="text-[11px] tracking-wider font-medium" style={{ color: "#87887F" }}>
              TICKET MÉDIO
            </span>
          </div>
          <span className="text-[28px] font-bold" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {fmt(avgTicket)}
          </span>
        </div>
        <div className="w-px mx-6" style={{ background: "#1E1F1E" }} />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2.5">
            <TrendingUp size={16} color="#F0654A" />
            <span className="text-[11px] tracking-wider font-medium" style={{ color: "#87887F" }}>
              DESCONTOS DADOS
            </span>
          </div>
          <span className="text-[28px] font-bold" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
            {fmt(totalDiscount)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1fr 1fr" }}>
        {/* Itens mais vendidos no período */}
        <div className="rounded-[10px] p-[22px]" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
          <div className="text-[13px] font-semibold mb-4" style={{ color: "#ECECE9" }}>
            Itens Mais Vendidos no Período
          </div>
          {topItems.length === 0 && (
            <div className="text-xs text-center py-8" style={{ color: "#4A4B47" }}>
              Nenhuma venda registrada nesse período
            </div>
          )}
          <div className="flex flex-col gap-2.5">
            {topItems.map((item, i) => (
              <div key={item.name}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs" style={{ color: "#ECECE9" }}>
                    {item.emoji} {item.name}
                  </span>
                  <span className="text-xs" style={{ color: "#87887F" }}>
                    {item.qty}x · {fmt(item.revenue)}
                  </span>
                </div>
                <div className="h-[3px] rounded-sm" style={{ background: "#1E1F1E" }}>
                  <div
                    className="h-[3px] rounded-sm"
                    style={{
                      width: `${(item.revenue / maxItemRevenue) * 100}%`,
                      background: i === 0 ? "#34D399" : "#4A4B47",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comandas recentes */}
        <div className="rounded-[10px] p-[22px]" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
          <div className="text-[13px] font-semibold mb-4" style={{ color: "#ECECE9" }}>
            Últimas Comandas Pagas
          </div>
          {filteredOrders.length === 0 && (
            <div className="text-xs text-center py-8" style={{ color: "#4A4B47" }}>
              Nenhuma comanda paga nesse período
            </div>
          )}
          <div className="flex flex-col gap-2 max-h-[280px] overflow-auto">
            {filteredOrders.slice(0, 15).map(order => (
              <div
                key={order.id}
                className="flex justify-between items-center py-2"
                style={{ borderBottom: "1px solid #1E1F1E" }}
              >
                <div>
                  <div className="text-xs font-medium" style={{ color: "#ECECE9" }}>
                    Mesa {order.tables ? String(order.tables.number).padStart(2, "0") : "—"}
                  </div>
                  <div className="text-[10px]" style={{ color: "#4A4B47" }}>
                    {new Date(order.closed_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    · Gar. {order.profiles?.name ?? "—"}
                  </div>
                </div>
                <span className="text-xs font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                  {fmt(Number(order.total_amount))}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fechamentos de caixa */}
      <div className="rounded-[10px] p-[22px]" style={{ background: "#1A1B1A", border: "1px solid #26272566" }}>
        <div className="flex items-center gap-2 mb-4">
          <Clock size={16} color="#E8B86D" />
          <span className="text-[13px] font-semibold" style={{ color: "#ECECE9" }}>
            Histórico de Fechamentos de Caixa
          </span>
        </div>

        {cashSessions.length === 0 && (
          <div className="text-xs text-center py-8" style={{ color: "#4A4B47" }}>
            Nenhum turno de caixa fechado ainda
          </div>
        )}

        <div className="flex flex-col gap-2">
          {cashSessions.map(session => {
            const isExpanded = expandedSession === session.id
            const opened = new Date(session.opened_at)
            const closed = session.closed_at ? new Date(session.closed_at) : null
            const received = (session.closing_amount ?? 0) - session.opening_amount

            return (
              <div key={session.id} style={{ background: "#131413", borderRadius: 10, border: "1px solid #1E1F1E" }}>
                <button
                  onClick={() => setExpandedSession(isExpanded ? null : session.id)}
                  className="w-full flex justify-between items-center px-4 py-3"
                >
                  <div className="text-left">
                    <div className="text-xs font-semibold" style={{ color: "#ECECE9" }}>
                      {opened.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" })}
                      {" · "}
                      Caixa: {session.profiles?.name ?? "—"}
                    </div>
                    <div className="text-[10px]" style={{ color: "#4A4B47" }}>
                      {opened.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                      {closed && ` — ${closed.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                      {fmt(session.closing_amount ?? 0)}
                    </span>
                    {isExpanded ? (
                      <ChevronUp size={15} color="#4A4B47" />
                    ) : (
                      <ChevronDown size={15} color="#4A4B47" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-3.5 pt-1 flex flex-col gap-1.5" style={{ borderTop: "1px solid #1E1F1E" }}>
                    <div className="flex justify-between text-xs pt-2.5">
                      <span style={{ color: "#87887F" }}>Fundo inicial</span>
                      <span style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
                        {fmt(session.opening_amount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: "#87887F" }}>Total recebido no turno</span>
                      <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                        {fmt(received)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold pt-1.5" style={{ borderTop: "1px solid #1E1F1E" }}>
                      <span style={{ color: "#ECECE9" }}>Total final na gaveta</span>
                      <span style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                        {fmt(session.closing_amount ?? 0)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}