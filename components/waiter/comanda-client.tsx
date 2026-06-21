"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Flame, Minus, Plus } from "lucide-react"

// ── Tipos ──────────────────────────────────────────────────────────────────
interface MenuItem {
  id: string
  name: string
  price: number
  prep_time_min: number
  emoji: string
}

interface Category {
  id: string
  name: string
  sort_order: number
  menu_items: MenuItem[]
}

interface Table {
  id: string
  number: number
  capacity: number
  location: string | null
  status: string
}

interface OrderItem {
  id: string
  menu_item_id: string
  quantity: number
  unit_price: number
  status: string
  menu_items: MenuItem
}

interface ExistingOrder {
  id: string
  status: string
  order_items: OrderItem[]
}

interface CartItem extends MenuItem {
  qty: number
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

// ── Componente ─────────────────────────────────────────────────────────────
export function ComandaClient({
  table,
  categories,
  existingOrder,
  waiterId,
  restaurantId,
}: {
  table: Table
  categories: Category[]
  existingOrder: ExistingOrder | null
  waiterId: string
  restaurantId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [activeCategory, setActiveCategory] = useState(categories[0]?.id ?? "")
  const [cart, setCart] = useState<CartItem[]>([])
  const [sending, setSending] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const activeItems = categories.find(c => c.id === activeCategory)?.menu_items ?? []

  const addItem = (item: MenuItem) => {
    setCart(prev => {
      const found = prev.find(i => i.id === item.id)
      if (found) {
        return prev.map(i => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i))
      }
      return [...prev, { ...item, qty: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setCart(prev => {
      const found = prev.find(i => i.id === id)
      if (found && found.qty > 1) {
        return prev.map(i => (i.id === id ? { ...i, qty: i.qty - 1 } : i))
      }
      return prev.filter(i => i.id !== id)
    })
  }

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0)
  const cartCount = cart.reduce((s, i) => s + i.qty, 0)

  // Itens já confirmados (de comanda existente)
  const confirmedItems = existingOrder?.order_items ?? []
  const confirmedTotal = confirmedItems.reduce(
    (s, i) => s + i.unit_price * i.quantity,
    0
  )

  const sendToKitchen = async () => {
    if (cart.length === 0) return
    setSending(true)

    try {
      let orderId = existingOrder?.id

      // Se não existe comanda aberta, cria uma
      if (!orderId) {
        const { data: newOrder, error: orderError } = await supabase
          .from("orders")
          .insert({
            restaurant_id: restaurantId,
            table_id: table.id,
            waiter_id: waiterId,
            status: "in_kitchen",
          })
          .select()
          .single()

        if (orderError || !newOrder) throw orderError

        orderId = newOrder.id

        // Marca a mesa como ocupada
        await supabase
          .from("tables")
          .update({ status: "occupied" })
          .eq("id", table.id)
      } else {
        // Atualiza status da comanda existente
        await supabase
          .from("orders")
          .update({ status: "in_kitchen" })
          .eq("id", orderId)
      }

      // Insere os itens do carrinho
      const itemsToInsert = cart.map(item => ({
        order_id: orderId,
        menu_item_id: item.id,
        waiter_id: waiterId,
        quantity: item.qty,
        unit_price: item.price,
        status: "sent",
      }))

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(itemsToInsert)

      if (itemsError) throw itemsError

      setCart([])
      setNotification("🔥 Pedido enviado para a cozinha!")
      setTimeout(() => {
        setNotification(null)
        router.refresh()
      }, 1500)
    } catch (err) {
      console.error(err)
      setNotification("❌ Erro ao enviar pedido. Tente novamente.")
      setTimeout(() => setNotification(null), 3000)
    } finally {
      setSending(false)
    }
  }

  return (
    <div style={{ background: "#0A0B0A", minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div
        className="flex justify-between items-center px-4 py-3 sticky top-0 z-10"
        style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}
      >
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/mesas")}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs"
            style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#87887F" }}
          >
            <ArrowLeft size={13} /> Voltar
          </button>
          <div>
            <div className="text-sm font-bold" style={{ color: "#ECECE9" }}>
              Mesa {String(table.number).padStart(2, "0")}
            </div>
            <div className="text-[11px]" style={{ color: "#4A4B47" }}>
              {table.location}
            </div>
          </div>
        </div>
        {cartCount > 0 && (
          <div
            className="rounded-full px-3 py-1 text-[13px] font-bold"
            style={{ background: "#34D399", color: "#0A0B0A" }}
          >
            {cartCount} {cartCount === 1 ? "item" : "itens"}
          </div>
        )}
      </div>

      {/* Notification */}
      {notification && (
        <div
          className="text-center text-[13px] font-semibold py-2.5"
          style={{ background: "#0F2A20", color: "#34D399", borderBottom: "1px solid #1E1F1E" }}
        >
          {notification}
        </div>
      )}

      {/* Itens já confirmados na comanda */}
      {confirmedItems.length > 0 && (
        <div className="px-4 py-3" style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}>
          <div className="text-[11px] mb-2 tracking-wide" style={{ color: "#4A4B47" }}>
            JÁ ENVIADO À COZINHA
          </div>
          <div className="flex flex-col gap-1.5">
            {confirmedItems.map(item => (
              <div key={item.id} className="flex justify-between text-xs">
                <span style={{ color: "#87887F" }}>
                  {item.quantity}x {item.menu_items.emoji} {item.menu_items.name}
                </span>
                <span style={{ color: "#4A4B47" }}>
                  {fmt(item.unit_price * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="text-xs mt-2 font-semibold" style={{ color: "#34D399" }}>
            Subtotal: {fmt(confirmedTotal)}
          </div>
        </div>
      )}

      {/* Categorias */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto" style={{ background: "#131413", borderBottom: "1px solid #1E1F1E" }}>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className="px-3.5 py-1.5 rounded-full text-[13px] whitespace-nowrap transition-all"
            style={{
              background: activeCategory === cat.id ? "#34D399" : "#1A1B1A",
              color: activeCategory === cat.id ? "#0A0B0A" : "#87887F",
              fontWeight: activeCategory === cat.id ? 700 : 400,
              border: `1px solid ${activeCategory === cat.id ? "#34D399" : "#262725"}`,
            }}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Itens do cardápio */}
      <div className="flex-1 overflow-auto p-3.5">
        <div className="grid grid-cols-2 gap-2.5">
          {activeItems.map(item => {
            const inCart = cart.find(i => i.id === item.id)
            return (
              <button
                key={item.id}
                onClick={() => addItem(item)}
                className="rounded-xl p-3.5 text-left relative transition-all"
                style={{
                  background: inCart ? "#0F2A20" : "#1A1B1A",
                  border: `1px solid ${inCart ? "#34D399" : "#262725"}`,
                }}
              >
                {inCart && (
                  <div
                    className="absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold"
                    style={{ background: "#34D399", color: "#0A0B0A" }}
                  >
                    {inCart.qty}
                  </div>
                )}
                <div className="text-2xl mb-1.5">{item.emoji}</div>
                <div className="text-[13px] font-semibold mb-1" style={{ color: "#ECECE9" }}>
                  {item.name}
                </div>
                <div className="flex justify-between items-center">
                  <span
                    className="text-sm font-bold"
                    style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}
                  >
                    {fmt(item.price)}
                  </span>
                  <span className="text-[11px]" style={{ color: "#4A4B47" }}>
                    ~{item.prep_time_min}min
                  </span>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Carrinho fixo embaixo */}
      {cart.length > 0 && (
        <div
          className="p-3.5"
          style={{ background: "#131413", borderTop: "1px solid #1E1F1E" }}
        >
          <div className="mb-2.5 max-h-[110px] overflow-auto flex flex-col gap-1.5">
            {cart.map(item => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="flex-1 text-xs" style={{ color: "#87887F" }}>
                  {item.emoji} {item.name}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => removeItem(item.id)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "#1A1B1A", border: "1px solid #262725" }}
                  >
                    <Minus size={12} color="#87887F" />
                  </button>
                  <span className="text-[13px] font-semibold w-4 text-center" style={{ color: "#ECECE9" }}>
                    {item.qty}
                  </span>
                  <button
                    onClick={() => addItem(item)}
                    className="w-6 h-6 rounded flex items-center justify-center"
                    style={{ background: "#1A1B1A", border: "1px solid #262725" }}
                  >
                    <Plus size={12} color="#87887F" />
                  </button>
                </div>
                <span
                  className="text-xs w-16 text-right"
                  style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}
                >
                  {fmt(item.price * item.qty)}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2.5" style={{ borderTop: "1px solid #1E1F1E" }}>
            <div>
              <div className="text-[11px]" style={{ color: "#4A4B47" }}>Total parcial</div>
              <div
                className="text-lg font-bold"
                style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}
              >
                {fmt(cartTotal)}
              </div>
            </div>
            <button
              onClick={sendToKitchen}
              disabled={sending}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-[13px] font-bold"
              style={{
                background: "#34D399",
                color: "#0A0B0A",
                opacity: sending ? 0.6 : 1,
              }}
            >
              <Flame size={15} />
              {sending ? "Enviando..." : "Enviar para Cozinha"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}