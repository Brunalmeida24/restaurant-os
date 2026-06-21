"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Wallet, Tag, Ban } from "lucide-react"
import { JustificationModal } from "./justification-modal"
import { SplitPayment } from "./split-payment"

interface OrderItem {
  id: string
  quantity: number
  unit_price: number
  menu_items: { name: string; emoji: string }
}

interface Order {
  id: string
  status: string
  people_count: number
  opened_at: string
  table_id: string
  discount_amount: number
  tables: { number: number; location: string | null }
  profiles: { name: string } | null
  order_items: OrderItem[]
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

function elapsedMinutes(openedAt: string) {
  return Math.floor((Date.now() - new Date(openedAt).getTime()) / 60000)
}

export function CashierClient({
  initialOrders,
  cashierId,
  restaurantId,
  cashSessionId,
}: {
  initialOrders: Order[]
  cashierId: string
  restaurantId: string
  cashSessionId: string | null
}) {
  const router = useRouter()
  const supabase = createClient()

  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [selected, setSelected] = useState<Order | null>(null)
  const [paid, setPaid] = useState(false)
  const [modal, setModal] = useState<"discount" | "cancel" | null>(null)
  const [discount, setDiscount] = useState(0)

  const orderSubtotal = (order: Order) =>
    order.order_items.reduce((s, i) => s + i.unit_price * i.quantity, 0)

  const totalPending = orders.reduce((s, o) => s + orderSubtotal(o), 0)

  const openOrder = (order: Order) => {
    setSelected(order)
    setPaid(false)
    setDiscount(order.discount_amount ?? 0)
  }

  const applyDiscount = async (reason: string, amount: number) => {
    if (!selected) return
    await supabase
      .from("orders")
      .update({ discount_amount: amount, discount_reason: reason })
      .eq("id", selected.id)

    await supabase.from("order_audit_log").insert({
      restaurant_id: restaurantId,
      order_id: selected.id,
      action: "apply_discount",
      performed_by: cashierId,
      justification: reason,
      amount,
    })

    setDiscount(amount)
    setModal(null)
  }

  const cancelOrder = async (reason: string) => {
    if (!selected) return

    await supabase
      .from("orders")
      .update({ status: "cancelled", cancel_reason: reason, closed_at: new Date().toISOString() })
      .eq("id", selected.id)

    await supabase.from("order_audit_log").insert({
      restaurant_id: restaurantId,
      order_id: selected.id,
      action: "cancel_order",
      performed_by: cashierId,
      justification: reason,
    })

    await supabase.from("tables").update({ status: "free" }).eq("id", selected.table_id)

    setOrders(prev => prev.filter(o => o.id !== selected.id))
    setModal(null)
    setSelected(null)
  }

  const finalizePayment = async (
    splits: { method: string; amount: number }[],
    cashReceived?: number
  ) => {
    if (!selected) return

    try {
      const paymentRecords = splits.map(s => ({
        restaurant_id: restaurantId,
        order_id: selected.id,
        cashier_id: cashierId,
        method: s.method,
        amount: s.amount,
        cash_session_id: cashSessionId,
      }))

      await supabase.from("payments").insert(paymentRecords)

      const subtotal = orderSubtotal(selected)
      const service = (subtotal - discount) * 0.1
      const final = subtotal - discount + service

      await supabase
        .from("orders")
        .update({ status: "paid", closed_at: new Date().toISOString(), total_amount: final })
        .eq("id", selected.id)

      await supabase.from("tables").update({ status: "free" }).eq("id", selected.table_id)

      setPaid(true)
      setOrders(prev => prev.filter(o => o.id !== selected.id))
    } catch (err) {
      console.error(err)
    }
  }

  // ── Tela de detalhe ────────────────────────────────────────────────────────
  if (selected) {
    const subtotal = orderSubtotal(selected)
    const service = (subtotal - discount) * 0.1
    const final = subtotal - discount + service

    return (
      <div style={{ background: "#0A0B0A", minHeight: "100vh" }}>
        <div className="flex items-center gap-3 px-5 py-3.5" style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}>
          <button
            onClick={() => setSelected(null)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#87887F" }}
          >
            <ArrowLeft size={13} /> Voltar
          </button>
          <div className="flex-1">
            <div className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
              Fechamento · Mesa {String(selected.tables.number).padStart(2, "0")}
            </div>
            <div className="text-[11px]" style={{ color: "#4A4B47" }}>
              Gar. {selected.profiles?.name ?? "—"} · {selected.people_count} pessoas
            </div>
          </div>
          {!paid && (
            <button
              onClick={() => setModal("cancel")}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
              style={{ background: "#3A1810", border: "1px solid #F0654A", color: "#F0654A" }}
            >
              <Ban size={13} /> Cancelar comanda
            </button>
          )}
        </div>

        <div className="max-w-[460px] mx-auto p-5">
          <div className="rounded-xl p-4 mb-3.5" style={{ background: "#1A1B1A", border: "1px solid #262725" }}>
            <div className="text-[13px] font-semibold mb-2.5" style={{ color: "#ECECE9" }}>
              Itens Consumidos
            </div>
            {selected.order_items.map((item, i) => (
              <div key={item.id} className="flex justify-between py-2" style={{ borderBottom: i < selected.order_items.length - 1 ? "1px solid #1E1F1E" : "none" }}>
                <span className="text-[13px]" style={{ color: "#87887F" }}>
                  {item.quantity}x {item.menu_items.emoji} {item.menu_items.name}
                </span>
                <span className="text-[13px]" style={{ color: "#ECECE9", fontFamily: "var(--font-mono)" }}>
                  {fmt(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="rounded-xl p-4 mb-3.5" style={{ background: "#1A1B1A", border: "1px solid #262725" }}>
            <div className="flex justify-between py-1.5">
              <span className="text-[13px]" style={{ color: "#87887F" }}>Subtotal</span>
              <span className="text-[13px]" style={{ color: "#87887F", fontFamily: "var(--font-mono)" }}>{fmt(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between py-1.5">
                <span className="text-[13px]" style={{ color: "#E8B86D" }}>Desconto aplicado</span>
                <span className="text-[13px]" style={{ color: "#E8B86D", fontFamily: "var(--font-mono)" }}>− {fmt(discount)}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5">
              <span className="text-[13px]" style={{ color: "#87887F" }}>Taxa de serviço (10%)</span>
              <span className="text-[13px]" style={{ color: "#87887F", fontFamily: "var(--font-mono)" }}>{fmt(service)}</span>
            </div>

            {!paid && (
              <button
                onClick={() => setModal("discount")}
                className="flex items-center gap-1.5 text-[11px] mt-1.5"
                style={{ color: "#E8B86D" }}
              >
                <Tag size={11} /> {discount > 0 ? "Alterar desconto" : "Aplicar desconto"}
              </button>
            )}

            <div className="flex justify-between pt-2.5 mt-1" style={{ borderTop: "1px solid #1E1F1E" }}>
              <span className="text-sm font-bold" style={{ color: "#ECECE9" }}>Total a pagar</span>
              <span className="text-lg font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>{fmt(final)}</span>
            </div>
          </div>

          {!paid ? (
            <SplitPayment total={final} onComplete={finalizePayment} />
          ) : (
            <div className="rounded-xl p-6 text-center" style={{ background: "#0F2A20", border: "1px solid #34D399" }}>
              <div className="text-4xl mb-2">✅</div>
              <div className="text-base font-bold" style={{ color: "#34D399" }}>Pagamento Confirmado!</div>
              <div className="text-[13px] mt-1" style={{ color: "#87887F" }}>
                Mesa {String(selected.tables.number).padStart(2, "0")} liberada com sucesso
              </div>
              <button
                onClick={() => setSelected(null)}
                className="mt-4 px-6 py-2.5 rounded-lg text-[13px] font-bold"
                style={{ background: "#34D399", color: "#0A0B0A" }}
              >
                ← Voltar ao Caixa
              </button>
            </div>
          )}
        </div>

        {modal === "discount" && (
          <JustificationModal
            title="Aplicar Desconto"
            actionLabel="Aplicar Desconto"
            onClose={() => setModal(null)}
            onConfirm={(reason) => {
              const amount = parseFloat(prompt("Valor do desconto (R$):", "0") || "0")
              if (amount > 0) applyDiscount(reason, amount)
            }}
          />
        )}

        {modal === "cancel" && (
          <JustificationModal
            title="Cancelar Comanda"
            actionLabel="Confirmar Cancelamento"
            onClose={() => setModal(null)}
            onConfirm={cancelOrder}
          />
        )}
      </div>
    )
  }

  // ── Lista de comandas ──────────────────────────────────────────────────────
  return (
    <div style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <div className="flex justify-between items-center px-5 py-3.5" style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}>
        <div className="flex items-center gap-2.5">
          <Wallet size={19} color="#34D399" />
          <div>
            <div className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>Caixa</div>
            <div className="text-[11px]" style={{ color: "#4A4B47" }}>
              {orders.length} comandas aguardando fechamento
            </div>
          </div>
        </div>
        <div className="rounded-lg px-3.5 py-1.5" style={{ background: "#0F2A20", border: "1px solid #34D399" }}>
          <div className="text-[10px]" style={{ color: "#4A4B47" }}>Total pendente</div>
          <div className="text-sm font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
            {fmt(totalPending)}
          </div>
        </div>
      </div>

      <div className="p-5">
        {orders.length === 0 && (
          <div className="text-center py-16 text-sm" style={{ color: "#4A4B47" }}>
            Nenhuma comanda pendente no momento
          </div>
        )}
        <div className="flex flex-col gap-2.5">
          {orders.map(order => {
            const total = orderSubtotal(order)
            const mins = elapsedMinutes(order.opened_at)
            return (
              <button
                key={order.id}
                onClick={() => openOrder(order)}
                className="flex justify-between items-center rounded-xl p-4 text-left"
                style={{ background: "#1A1B1A", border: "1px solid #262725" }}
              >
                <div className="flex items-center gap-3.5">
                  <div
                    className="w-11 h-11 rounded-lg flex items-center justify-center text-base font-bold"
                    style={{ background: "#0F2A20", color: "#34D399", fontFamily: "var(--font-mono)" }}
                  >
                    {String(order.tables.number).padStart(2, "0")}
                  </div>
                  <div>
                    <div className="text-sm font-semibold" style={{ color: "#ECECE9" }}>
                      Mesa {String(order.tables.number).padStart(2, "0")}
                    </div>
                    <div className="text-[11px]" style={{ color: "#4A4B47" }}>
                      {order.people_count} pessoas · {mins}min · Gar. {order.profiles?.name ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-base font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                    {fmt(total)}
                  </div>
                  <div className="text-[10px]" style={{ color: "#4A4B47" }}>+ 10% serviço</div>
                </div>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}