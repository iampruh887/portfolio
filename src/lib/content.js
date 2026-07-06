import { supabase } from './supabase.js'

export async function fetchList(table) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('is_published', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchProfile() {
  const { data, error } = await supabase.from('profile').select('*').maybeSingle()
  if (error) throw error
  return data
}
