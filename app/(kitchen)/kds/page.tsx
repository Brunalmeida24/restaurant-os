import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { KdsClient } from "@/components/kitchen/kds-client"

export default async function KdsPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/login")

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single()

  if (!profile) redirect("/login")

  const { data: orderItems } = await supabase
    .from("order_items")
    .select(`
      *,
      menu_items(name, emoji, prep_time_min),
      orders!inner(id, table_id, restaurant_id, tables(number)),
      profiles(name)
    `)
    .eq("orders.restaurant_id", profile.restaurant_id)
    .in("status", ["sent", "preparing", "ready"])
    .order("created_at")

  return (
    <KdsClient
      initialItems={orderItems ?? []}
      restaurantId={profile.restaurant_id}
    />
  )
}