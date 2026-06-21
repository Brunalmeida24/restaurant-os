import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ComandaClient } from "@/components/waiter/comanda-client"

export default async function ComandaPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  // Busca a mesa
  const { data: table } = await supabase
    .from("tables")
    .select("*")
    .eq("id", id)
    .single()

  if (!table) notFound()

  // Busca categorias + itens do cardápio
  const { data: categories } = await supabase
    .from("categories")
    .select("*, menu_items(*)")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("active", true)
    .order("sort_order")

  // Busca comanda aberta dessa mesa (se existir)
  const { data: existingOrder } = await supabase
    .from("orders")
    .select("*, order_items(*, menu_items(*))")
    .eq("table_id", id)
    .in("status", ["open", "in_kitchen", "ready", "served"])
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  return (
    <ComandaClient
      table={table}
      categories={categories ?? []}
      existingOrder={existingOrder}
      waiterId={profile.id}
      restaurantId={profile.restaurant_id}
    />
  )
}