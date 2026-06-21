"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Flame } from "lucide-react"

interface OrderItem {
  id: string
  order_id: string
  quantity: number
  notes: string | null
  status: string
  created_at: string
  menu_items: { name: string; emoji: string; prep_time_min: number }
  orders: { id: string; table_id: string; restaurant_id: string; tables: { number: number } }
  profiles: { name: string } | null
}

const statusConfig: Record<string, { label: string; color: string; bg: string; nextLabel: string; next: string | null }> = {
  sent:      { label: "Novo",       color: "#60A5FA", bg: "#102540", nextLabel: "Iniciar preparo", next: "preparing" },
  preparing: { label: "Preparando", color: "#E8B86D", bg: "#3D2305", nextLabel: "Marcar Pronto",   next: "ready" },
  ready:     { label: "Pronto",     color: "#34D399", bg: "#0F2A20", nextLabel: "Entregue",         next: null },
}

function elapsedMinutes(createdAt: string) {
  return Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000)
}

export function KdsClient({
  initialItems,
  restaurantId,
}: {
  initialItems: OrderItem[]
  restaurantId: string
}) {
  const [items, setItems] = useState<OrderItem[]>(initialItems)
  const [, forceTick] = useState(0)
  const supabase = createClient()

  // Atualiza o relógio a cada 30s pra recalcular "minutos atrás"
  useEffect(() => {
    const tick = setInterval(() => forceTick(t => t + 1), 30000)
    return () => clearInterval(tick)
  }, [])

  // Realtime: escuta mudanças em order_items
  useEffect(() => {
    const channel = supabase
      .channel("kds-order-items")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "order_items" },
        async (payload) => {
          // Busca o item completo com os relacionamentos
          const { data } = await supabase
            .from("order_items")
            .select(`
              *,
              menu_items(name, emoji, prep_time_min),
              orders!inner(id, table_id, restaurant_id, tables(number)),
              profiles(name)
            `)
            .eq("id", payload.new.id)
            .single()

          if (data && data.orders.restaurant_id === restaurantId) {
            setItems(prev => [...prev, data as OrderItem])
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "order_items" },
        (payload) => {
          setItems(prev => {
            const updated = payload.new as OrderItem
            if (updated.status === "served" || updated.status === "cancelled") {
              return prev.filter(i => i.id !== updated.id)
            }
            return prev.map(i => (i.id === updated.id ? { ...i, ...updated } : i))
          })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [restaurantId, supabase])

  const advance = async (item: OrderItem) => {
    const config = statusConfig[item.status]
    if (!config.next) {
      // "Entregue" — remove da tela
      await supabase.from("order_items").update({ status: "served" }).eq("id", item.id)
      setItems(prev => prev.filter(i => i.id !== item.id))
      return
    }
    await supabase.from("order_items").update({ status: config.next }).eq("id", item.id)
  }

  const columns = ["sent", "preparing", "ready"]

  return (
    <div style={{ background: "#050606", minHeight: "100vh" }}>
      {/* Header */}
      <div
        className="flex justify-between items-center px-6 py-3.5"
        style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}
      >
        <div className="flex items-center gap-3">
          <Flame size={20} color="#E8B86D" />
          <div>
            <div className="text-[16px] font-bold" style={{ color: "#ECECE9" }}>
              Kitchen Display
            </div>
            <div className="text-[11px]" style={{ color: "#4A4B47" }}>
              Atualizando em tempo real
            </div>
          </div>
        </div>
        <div className="flex gap-5">
          {columns.map(s => {
            const c = statusConfig[s]
            return (
              <div key={s} className="text-center">
                <div
                  className="text-xl font-bold"
                  style={{ color: c.color, fontFamily: "var(--font-mono)" }}
                >
                  {items.filter(i => i.status === s).length}
                </div>
                <div className="text-[10px]" style={{ color: "#4A4B47" }}>
                  {c.label}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Colunas */}
      <div className="grid grid-cols-3 gap-3.5 p-4">
        {columns.map(status => {
          const c = statusConfig[status]
          const colItems = items
            .filter(i => i.status === status)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

          return (
            <div key={status}>
              <div
                className="flex items-center gap-2 px-3 py-2 rounded-lg mb-2.5"
                style={{ background: c.bg }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ background: c.color }} />
                <span className="text-xs font-bold" style={{ color: c.color }}>
                  {c.label}
                </span>
                <span className="ml-auto text-sm font-bold" style={{ color: c.color }}>
                  {colItems.length}
                </span>
              </div>

              {colItems.map(item => {
                const mins = elapsedMinutes(item.created_at)
                const late = mins >= 20
                return (
                  <div
                    key={item.id}
                    className="rounded-xl p-3.5 mb-2.5"
                    style={{
                      background: "#1A1B1A",
                      border: `1px solid ${late ? "#F0654A" : "#262725"}`,
                      boxShadow: status === "ready" ? "0 0 14px rgba(52,211,153,0.15)" : "none",
                    }}
                  >
                    <div className="flex justify-between mb-2.5">
                      <div>
                        <div className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
                          Mesa {String(item.orders.tables.number).padStart(2, "0")}
                        </div>
                        <div className="text-[11px]" style={{ color: "#4A4B47" }}>
                          {item.profiles?.name ?? "Garçom"}
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className="text-lg font-bold"
                          style={{ color: late ? "#F0654A" : "#87887F", fontFamily: "var(--font-mono)" }}
                        >
                          {mins}m
                        </div>
                        {late && (
                          <div className="text-[9px] font-bold" style={{ color: "#F0654A" }}>
                            ATRASADO
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2 pb-2.5 mb-2.5" style={{ borderBottom: "1px solid #1E1F1E" }}>
                      <span className="text-base font-bold" style={{ color: "#34D399" }}>
                        {item.quantity}x
                      </span>
                      <div>
                        <div className="text-[13px]" style={{ color: "#ECECE9" }}>
                          {item.menu_items.emoji} {item.menu_items.name}
                        </div>
                        {item.notes && (
                          <div className="text-[11px] mt-0.5" style={{ color: "#E8B86D" }}>
                            ⚠ {item.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => advance(item)}
                      className="w-full py-2 rounded-lg text-xs font-bold"
                      style={{ background: c.bg, color: c.color, border: `1px solid ${c.color}` }}
                    >
                      {c.nextLabel} →
                    </button>
                  </div>
                )
              })}

              {colItems.length === 0 && (
                <div className="text-center text-xs py-8" style={{ color: "#4A4B47" }}>
                  Nenhum pedido
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}