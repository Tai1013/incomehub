import { supabase } from '../lib/supabase'
import type { IncomeEntry, IncomeType } from '../types/income'
import { FAVORITE_CHART_KEYS } from '../types/chart'
import type { FavoriteChartKey } from '../types/chart'

interface IncomeEntryRow {
  id: string
  income_date: string
  income_type: IncomeType
  amount: number
  description: string | null
}

interface IncomeEntryPayload {
  date: string
  type: IncomeType
  amount: number
  description?: string
}

interface FavoriteChartProfileRow {
  favorite_chart_keys: string[] | null
}

const favoriteChartKeySet = new Set(FAVORITE_CHART_KEYS)

const toFavoriteChartKeys = (keys: unknown): FavoriteChartKey[] => {
  if (!Array.isArray(keys)) {
    return []
  }

  return keys.filter((item): item is FavoriteChartKey => typeof item === 'string' && favoriteChartKeySet.has(item as FavoriteChartKey))
}

const getCurrentUserId = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error) {
    throw error
  }

  if (!user?.id) {
    throw new Error('尚未登入')
  }

  return user.id
}

const getFavoriteChartKeysByUserId = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('favorite_chart_keys')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    throw error
  }

  return toFavoriteChartKeys((data as FavoriteChartProfileRow | null)?.favorite_chart_keys)
}

const updateFavoriteChartKeys = async (userId: string, keys: FavoriteChartKey[]) => {
  const { error } = await supabase
    .from('profiles')
    .upsert(
      {
        id: userId,
        favorite_chart_keys: keys,
      },
      {
        onConflict: 'id',
      },
    )

  if (error) {
    throw error
  }
}

const normalizeFavoriteChartKeys = (keys: FavoriteChartKey[]) => {
  const uniqueKeys = Array.from(new Set(keys))
  return toFavoriteChartKeys(uniqueKeys)
}

export const listIncomeEntries = async () => {
  const { data, error } = await supabase
    .from('income_entries')
    .select('id, income_date, income_type, amount, description')
    .order('income_date', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    throw error
  }

  return ((data ?? []) as IncomeEntryRow[]).map<IncomeEntry>((item) => ({
    id: item.id,
    date: item.income_date,
    type: item.income_type,
    amount: Number(item.amount),
    description: item.description ?? '',
  }))
}

export const createIncomeEntry = async (payload: IncomeEntryPayload) => {
  const { data, error } = await supabase
    .from('income_entries')
    .insert({
      income_date: payload.date,
      income_type: payload.type,
      amount: payload.amount,
      description: payload.description?.trim() || null,
    })
    .select('id, income_date, income_type, amount, description')
    .single()

  if (error) {
    throw error
  }

  const item = data as IncomeEntryRow

  return {
    id: item.id,
    date: item.income_date,
    type: item.income_type,
    amount: Number(item.amount),
    description: item.description ?? '',
  } satisfies IncomeEntry
}

export const updateIncomeEntry = async (id: string, payload: IncomeEntryPayload) => {
  const { data, error } = await supabase
    .from('income_entries')
    .update({
      income_date: payload.date,
      income_type: payload.type,
      amount: payload.amount,
      description: payload.description?.trim() || null,
    })
    .eq('id', id)
    .select('id, income_date, income_type, amount, description')
    .single()

  if (error) {
    throw error
  }

  const item = data as IncomeEntryRow

  return {
    id: item.id,
    date: item.income_date,
    type: item.income_type,
    amount: Number(item.amount),
    description: item.description ?? '',
  } satisfies IncomeEntry
}

export const deleteIncomeEntry = async (id: string) => {
  const { error } = await supabase.from('income_entries').delete().eq('id', id)

  if (error) {
    throw error
  }
}

export const listFavoriteCharts = async () => {
  const userId = await getCurrentUserId()
  return getFavoriteChartKeysByUserId(userId)
}

export const setFavoriteCharts = async (keys: FavoriteChartKey[]) => {
  const userId = await getCurrentUserId()
  const nextKeys = normalizeFavoriteChartKeys(keys)
  await updateFavoriteChartKeys(userId, nextKeys)
}

export const isIncomeTypeInUse = async (label: string): Promise<boolean> => {
  const { count, error } = await supabase
    .from('income_entries')
    .select('id', { count: 'exact', head: true })
    .eq('income_type', label)

  if (error) throw error
  return (count ?? 0) > 0
}