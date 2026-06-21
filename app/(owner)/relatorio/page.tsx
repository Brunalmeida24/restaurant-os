import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OwnerSidebar } from "@/components/owner/sidebar"
import { RelatorioClient } from "@/components/owner/relatorio-client"

export default async function RelatorioPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") redirect("/login")

  // Últimos 30 dias de comandas pagas
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const { data: paidOrders } = await supabase
    .from("orders")
    .select(`
      *,
      tables(number),
      profiles(name),
      order_items(quantity, unit_price, menu_items(name, emoji))
    `)
    .eq("restaurant_id", profile.restaurant_id)
    .eq("status", "paid")
    .gte("closed_at", thirtyDaysAgo.toISOString())
    .order("closed_at", { ascending: false })

  // Sessões de caixa fechadas
  const { data: cashSessions } = await supabase
    .from("cash_sessions")
    .select("*, profiles(name)")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("status", "closed")
    .order("closed_at", { ascending: false })
    .limit(20)

  return (
    <div className="flex" style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <OwnerSidebar
        ownerName={profile.name}
        restaurantName={profile.restaurants?.name ?? "Restaurant"}
      />
      <RelatorioClient
        paidOrders={paidOrders ?? []}
        cashSessions={cashSessions ?? []}
      />
    </div>
  )
}