import { supabase } from '../lib/supabase'
import type { IncomeEntry, IncomeType } from '../types/income'

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