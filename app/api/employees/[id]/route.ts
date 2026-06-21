import { createClient } from "@supabase/supabase-js"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

async function verifyOwner() {
  const supabaseServer = await createServerClient()
  const { data: { user } } = await supabaseServer.auth.getUser()

  if (!user) return { error: "Não autenticado", status: 401 }

  const { data: profile } = await supabaseServer
    .from("profiles")
    .select("role, restaurant_id")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "owner") {
    return { error: "Apenas o proprietário pode gerenciar funcionários", status: 403 }
  }

  return { profile }
}

// PATCH: editar nome/role, resetar senha, ativar/desativar
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { name, role, active, newPassword } = body

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Confirma que o funcionário pertence ao mesmo restaurante do owner
  const { data: targetProfile } = await supabaseAdmin
    .from("profiles")
    .select("restaurant_id, role")
    .eq("id", id)
    .single()

  if (!targetProfile || targetProfile.restaurant_id !== auth.profile.restaurant_id) {
    return NextResponse.json({ error: "Funcionário não encontrado" }, { status: 404 })
  }

  if (targetProfile.role === "owner") {
    return NextResponse.json({ error: "Não é possível editar o proprietário" }, { status: 400 })
  }

  // Atualiza perfil (nome, role, ativo)
  const profileUpdate: Record<string, unknown> = {}
  if (name !== undefined) profileUpdate.name = name
  if (role !== undefined) profileUpdate.role = role
  if (active !== undefined) profileUpdate.active = active

  if (Object.keys(profileUpdate).length > 0) {
    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("id", id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 })
    }
  }

  // Reseta senha, se solicitado
  if (newPassword) {
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Senha deve ter no mínimo 6 caracteres" }, { status: 400 })
    }

    const { error: passwordError } = await supabaseAdmin.auth.admin.updateUserById(id, {
      password: newPassword,
    })

    if (passwordError) {
      return NextResponse.json({ error: passwordError.message }, { status: 400 })
    }
  }

  return NextResponse.json({ success: true })
}

// GET: busca o e-mail do funcionário (não fica salvo em profiles, vem do Auth)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const auth = await verifyOwner()
  if ("error" in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  const { data, error } = await supabaseAdmin.auth.admin.getUserById(id)

  if (error || !data.user) {
    return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
  }

  return NextResponse.json({ email: data.user.email })
}