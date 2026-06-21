"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Plus, X, Pencil, EyeOff, Eye, FolderPlus } from "lucide-react"

interface MenuItem {
  id: string
  name: string
  price: number
  prep_time_min: number
  emoji: string
  available: boolean
  category_id: string
}

interface Category {
  id: string
  name: string
  sort_order: number
  menu_items: MenuItem[]
}

const fmt = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`

const commonEmojis = ["🍞","🥩","🐟","🧀","🍚","🍗","🍝","💧","🍊","🥤","🍺","🍷","🍫","🍮","🍨","🍕","🍔","🥗","🍤","🌮"]

export function CardapioClient({
  initialCategories,
  restaurantId,
}: {
  initialCategories: Category[]
  restaurantId: string
}) {
  const router = useRouter()
  const supabase = createClient()

  const [categories, setCategories] = useState(initialCategories)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [creatingForCategory, setCreatingForCategory] = useState<string | null>(null)
  const [creatingCategory, setCreatingCategory] = useState(false)
  const [newCategoryName, setNewCategoryName] = useState("")
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    name: "",
    price: "",
    prep_time_min: "10",
    emoji: "🍽️",
  })

  const resetForm = () => setForm({ name: "", price: "", prep_time_min: "10", emoji: "🍽️" })

  const openEdit = (item: MenuItem) => {
    setEditingItem(item)
    setForm({
      name: item.name,
      price: String(item.price),
      prep_time_min: String(item.prep_time_min),
      emoji: item.emoji,
    })
  }

  const openCreate = (categoryId: string) => {
    setCreatingForCategory(categoryId)
    resetForm()
  }

  const closeModal = () => {
    setEditingItem(null)
    setCreatingForCategory(null)
    resetForm()
  }

  const saveItem = async () => {
    if (!form.name.trim() || !form.price) return
    setSaving(true)

    const payload = {
      name: form.name.trim(),
      price: parseFloat(form.price),
      prep_time_min: parseInt(form.prep_time_min) || 10,
      emoji: form.emoji,
    }

    if (editingItem) {
      await supabase.from("menu_items").update(payload).eq("id", editingItem.id)
      setCategories(prev =>
        prev.map(cat => ({
          ...cat,
          menu_items: cat.menu_items.map(i => (i.id === editingItem.id ? { ...i, ...payload } : i)),
        }))
      )
    } else if (creatingForCategory) {
      const { data } = await supabase
        .from("menu_items")
        .insert({ ...payload, restaurant_id: restaurantId, category_id: creatingForCategory })
        .select()
        .single()

      if (data) {
        setCategories(prev =>
          prev.map(cat =>
            cat.id === creatingForCategory ? { ...cat, menu_items: [...cat.menu_items, data] } : cat
          )
        )
      }
    }

    setSaving(false)
    closeModal()
    router.refresh()
  }

  const toggleAvailable = async (item: MenuItem) => {
    await supabase.from("menu_items").update({ available: !item.available }).eq("id", item.id)
    setCategories(prev =>
      prev.map(cat => ({
        ...cat,
        menu_items: cat.menu_items.map(i => (i.id === item.id ? { ...i, available: !i.available } : i)),
      }))
    )
  }

  const saveCategory = async () => {
    if (!newCategoryName.trim()) return
    setSaving(true)

    const { data } = await supabase
      .from("categories")
      .insert({
        name: newCategoryName.trim(),
        restaurant_id: restaurantId,
        sort_order: categories.length + 1,
      })
      .select()
      .single()

    if (data) {
      setCategories(prev => [...prev, { ...data, menu_items: [] }])
    }

    setSaving(false)
    setCreatingCategory(false)
    setNewCategoryName("")
  }

  return (
    <div className="flex-1 p-7 px-8">
      <div className="flex justify-between items-center mb-7">
        <div>
          <h1 className="text-[19px] font-bold tracking-tight" style={{ color: "#ECECE9" }}>
            Cardápio
          </h1>
          <p className="text-xs mt-1" style={{ color: "#4A4B47" }}>
            {categories.reduce((s, c) => s + c.menu_items.length, 0)} itens em {categories.length} categorias
          </p>
        </div>
        <button
          onClick={() => setCreatingCategory(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-[13px] font-bold"
          style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
        >
          <FolderPlus size={15} /> Nova Categoria
        </button>
      </div>

      <div className="flex flex-col gap-5">
        {categories.map(category => (
          <div key={category.id}>
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-sm font-bold" style={{ color: "#ECECE9" }}>
                {category.name}
              </h2>
              <button
                onClick={() => openCreate(category.id)}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{ color: "#34D399" }}
              >
                <Plus size={13} /> Adicionar item
              </button>
            </div>

            <div className="grid gap-2.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
              {category.menu_items.map(item => (
                <div
                  key={item.id}
                  className="rounded-xl p-3.5 relative"
                  style={{
                    background: "#1A1B1A",
                    border: "1px solid #262725",
                    opacity: item.available ? 1 : 0.45,
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-2xl">{item.emoji}</span>
                    <div className="flex gap-1.5">
                      <button onClick={() => toggleAvailable(item)} title={item.available ? "Desativar" : "Ativar"}>
                        {item.available ? (
                          <Eye size={14} color="#4A4B47" />
                        ) : (
                          <EyeOff size={14} color="#F0654A" />
                        )}
                      </button>
                      <button onClick={() => openEdit(item)} title="Editar">
                        <Pencil size={14} color="#4A4B47" />
                      </button>
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold mb-1" style={{ color: "#ECECE9" }}>
                    {item.name}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-bold" style={{ color: "#34D399", fontFamily: "var(--font-mono)" }}>
                      {fmt(item.price)}
                    </span>
                    <span className="text-[11px]" style={{ color: "#4A4B47" }}>
                      ~{item.prep_time_min}min
                    </span>
                  </div>
                  {!item.available && (
                    <div
                      className="absolute top-2 left-2 text-[9px] font-bold px-1.5 py-0.5 rounded"
                      style={{ background: "#3A1810", color: "#F0654A" }}
                    >
                      INDISPONÍVEL
                    </div>
                  )}
                </div>
              ))}

              {category.menu_items.length === 0 && (
                <div
                  className="rounded-xl p-4 flex items-center justify-center text-xs"
                  style={{ background: "#131413", border: "1px dashed #262725", color: "#4A4B47", minHeight: 90 }}
                >
                  Nenhum item ainda
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {(editingItem || creatingForCategory) && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#131413", border: "1px solid #262725" }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
                {editingItem ? "Editar Item" : "Novo Item"}
              </h2>
              <button onClick={closeModal}>
                <X size={18} color="#4A4B47" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 mb-3.5">
              {commonEmojis.map(e => (
                <button
                  key={e}
                  onClick={() => setForm(f => ({ ...f, emoji: e }))}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-base"
                  style={{
                    background: form.emoji === e ? "#0F2A20" : "#1A1B1A",
                    border: `1px solid ${form.emoji === e ? "#34D399" : "#262725"}`,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>

            <div className="flex flex-col gap-2.5">
              <input
                type="text"
                placeholder="Nome do item"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                className="rounded-lg px-3.5 py-2.5 text-sm outline-none"
                style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
              />
              <div className="flex gap-2.5">
                <input
                  type="number"
                  step="0.01"
                  placeholder="Preço"
                  value={form.price}
                  onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                  className="flex-1 rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#34D399", fontFamily: "var(--font-mono)" }}
                />
                <input
                  type="number"
                  placeholder="Min. preparo"
                  value={form.prep_time_min}
                  onChange={e => setForm(f => ({ ...f, prep_time_min: e.target.value }))}
                  className="w-28 rounded-lg px-3.5 py-2.5 text-sm outline-none"
                  style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
                />
              </div>

              <button
                onClick={saveItem}
                disabled={saving || !form.name.trim() || !form.price}
                className="rounded-lg py-2.5 text-sm font-bold mt-1.5"
                style={{
                  background: form.name.trim() && form.price ? "#34D399" : "#1E1F1E",
                  color: form.name.trim() && form.price ? "#0A0B0A" : "#4A4B47",
                  opacity: saving ? 0.6 : 1,
                }}
              >
                {saving ? "Salvando..." : editingItem ? "Salvar Alterações" : "Adicionar Item"}
              </button>
            </div>
          </div>
        </div>
      )}

      {creatingCategory && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-50" style={{ background: "rgba(0,0,0,0.75)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "#131413", border: "1px solid #262725" }}>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-[15px] font-bold" style={{ color: "#ECECE9" }}>
                Nova Categoria
              </h2>
              <button onClick={() => setCreatingCategory(false)}>
                <X size={18} color="#4A4B47" />
              </button>
            </div>
            <input
              type="text"
              placeholder="Nome da categoria (ex: Petiscos)"
              value={newCategoryName}
              onChange={e => setNewCategoryName(e.target.value)}
              className="w-full rounded-lg px-3.5 py-2.5 text-sm outline-none mb-3.5"
              style={{ background: "#1A1B1A", border: "1px solid #262725", color: "#ECECE9" }}
            />
            <button
              onClick={saveCategory}
              disabled={saving || !newCategoryName.trim()}
              className="w-full rounded-lg py-2.5 text-sm font-bold"
              style={{
                background: newCategoryName.trim() ? "#34D399" : "#1E1F1E",
                color: newCategoryName.trim() ? "#0A0B0A" : "#4A4B47",
              }}
            >
              {saving ? "Criando..." : "Criar Categoria"}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}