import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { OwnerSidebar } from "@/components/owner/sidebar"
import { DashboardClient } from "@/components/owner/dashboard-client"

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*, restaurants(name)")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") redirect("/login")

  // Início do dia de hoje
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  // Comandas pagas hoje
  const { data: paidToday } = await supabase
    .from("orders")
    .select("id, total_amount, closed_at, order_items(quantity, unit_price, menu_items(name, emoji))")
    .eq("restaurant_id", profile.restaurant_id)
    .eq("status", "paid")
    .gte("closed_at", startOfDay.toISOString())

  // Mesas
  const { data: tables } = await supabase
    .from("tables")
    .select("status")
    .eq("restaurant_id", profile.restaurant_id)

  // Pedidos abertos (não pagos)
  const { data: openOrders } = await supabase
    .from("orders")
    .select("id, status")
    .eq("restaurant_id", profile.restaurant_id)
    .in("status", ["open", "in_kitchen", "ready", "served", "awaiting_payment"])

  // Pagamentos de hoje (pra formas de pagamento)
  const { data: paymentsToday } = await supabase
    .from("payments")
    .select("method, amount, created_at")
    .eq("restaurant_id", profile.restaurant_id)
    .gte("created_at", startOfDay.toISOString())

  return (
    <div className="flex" style={{ background: "#0A0B0A", minHeight: "100vh" }}>
      <OwnerSidebar
        ownerName={profile.name}
        restaurantName={profile.restaurants?.name ?? "Restaurant"}
      />
      <DashboardClient
        paidToday={paidToday ?? []}
        tables={tables ?? []}
        openOrders={openOrders ?? []}
        paymentsToday={paymentsToday ?? []}
      />
    </div>
  )
}