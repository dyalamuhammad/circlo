import type { SupabaseClient, User } from '@supabase/supabase-js'

export async function ensureProfile(supabase: SupabaseClient, user: User) {
  const meta = user.user_metadata ?? {}
  const displayName = user.is_anonymous
    ? `Guest ${user.id.slice(0, 4)}`
    : meta.full_name ?? meta.name ?? user.email?.split('@')[0] ?? 'User'

  const { error } = await supabase.from('circle_profiles').upsert(
    {
      id: user.id,
      display_name: displayName,
      avatar_url: meta.avatar_url ?? null,
      is_guest: !!user.is_anonymous,
    },
    { onConflict: 'id', ignoreDuplicates: true }
  )
  if (error) console.error('ensureProfile:', error.message)
}