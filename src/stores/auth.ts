import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useLoading } from '../composables/useLoading'
import { FAVORITE_CHART_KEYS } from '../types/chart'
import type { FavoriteChartKey } from '../types/chart'
import type { IncomeTypeConfig } from '../types/income'

interface ProfileRow {
  role: string | null
  yearly_target: number | null
  monthly_target: number | null
  favorite_chart_keys: string[] | null
  income_type_configs: { icon: string; label: string }[] | null
}

export const useAuthStore = defineStore('auth', () => {
  const { load, unLoad } = useLoading()
  const user = ref<User | null>(null)
  const role = ref('user')
  const roleStatus = ref<'idle' | 'loaded' | 'missing' | 'error'>('idle')
  const ready = ref(false)
  const loading = ref(false)
  const yearlyTarget = ref<number | null>(null)
  const monthlyTarget = ref<number | null>(null)
  const favoriteChartKeys = ref<FavoriteChartKey[]>([])
  const incomeTypeConfigs = ref<IncomeTypeConfig[]>([])
  let initialized = false
  let roleRequestUserId: string | null = null

  const favoriteChartKeySet = new Set(FAVORITE_CHART_KEYS)

  const toIncomeTypeConfigs = (configs: unknown): IncomeTypeConfig[] => {
    if (!Array.isArray(configs)) return []
    return configs.filter(
      (item): item is IncomeTypeConfig =>
        item !== null &&
        typeof item === 'object' &&
        typeof item.icon === 'string' &&
        typeof item.label === 'string' &&
        item.label.trim() !== ''
    )
  }

  const toFavoriteChartKeys = (keys: unknown): FavoriteChartKey[] => {
    if (!Array.isArray(keys)) {
      return []
    }

    return keys.filter((item): item is FavoriteChartKey => {
      return typeof item === 'string' && favoriteChartKeySet.has(item as FavoriteChartKey)
    })
  }

  const loadRole = async (userId: string | undefined) => {
    if (!userId) {
      role.value = 'user'
      roleStatus.value = 'idle'
      roleRequestUserId = null
      yearlyTarget.value = null
      monthlyTarget.value = null
      favoriteChartKeys.value = []
      incomeTypeConfigs.value = []
      return
    }

    if (roleRequestUserId === userId && roleStatus.value === 'loaded') {
      return
    }

    roleRequestUserId = userId

    load()
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, yearly_target, monthly_target, favorite_chart_keys, income_type_configs')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Failed to load profile role', error)
        role.value = 'user'
        roleStatus.value = 'error'
        yearlyTarget.value = null
        monthlyTarget.value = null
        favoriteChartKeys.value = []
        incomeTypeConfigs.value = []
        return
      }

      const profile = data as ProfileRow | null

      if (!profile) {
        role.value = 'user'
        roleStatus.value = 'missing'
        yearlyTarget.value = null
        monthlyTarget.value = null
        favoriteChartKeys.value = []
        incomeTypeConfigs.value = []
        return
      }

      role.value = normalizeRole(profile.role)
      yearlyTarget.value = profile.yearly_target ?? null
      monthlyTarget.value = profile.monthly_target ?? null
      favoriteChartKeys.value = toFavoriteChartKeys(profile.favorite_chart_keys)
      incomeTypeConfigs.value = toIncomeTypeConfigs(profile.income_type_configs)
      roleStatus.value = profile.role ? 'loaded' : 'missing'
    } finally {
      unLoad()
    }
  }

  const normalizeRole = (nextRole: string | null | undefined) => {
    const trimmedRole = nextRole?.trim().toLowerCase()
    return trimmedRole || 'user'
  }

  const initAuth = async () => {
    if (initialized) {
      return
    }

    initialized = true

    let initialUser: User | null = null

    load()
    try {
      const {
        data: { user: nextUser },
      } = await supabase.auth.getUser()
      initialUser = nextUser
    } finally {
      unLoad()
    }

    user.value = initialUser
    await loadRole(initialUser?.id)

    supabase.auth.onAuthStateChange(async (_event, session) => {
      user.value = session?.user ?? null
      await loadRole(session?.user?.id)
    })

    ready.value = true
  }

  const signUpWithEmail = async (email: string, password: string) => {
    loading.value = true
    load()
    try {
      const { data, error } = await supabase.auth.signUp({ email, password })
      if (error) {
        throw error
      }
      user.value = data.user

      return data
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const signInWithEmail = async (email: string, password: string) => {
    loading.value = true
    load()
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        throw error
      }
      user.value = data.user
      return data
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const signOut = async () => {
    loading.value = true
    load()
    try {
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
      user.value = null
      role.value = normalizeRole(null)
      roleStatus.value = 'idle'
      roleRequestUserId = null
      yearlyTarget.value = null
      monthlyTarget.value = null
      favoriteChartKeys.value = []
      incomeTypeConfigs.value = []
    } finally {
      loading.value = false
      unLoad()
    }
  }

  const updateIncomeTypeConfigs = async (configs: IncomeTypeConfig[]) => {
    const userId = user.value?.id
    if (!userId) return

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, income_type_configs: configs },
        { onConflict: 'id' }
      )

    if (error) throw error
    incomeTypeConfigs.value = configs
  }

  const updateTargets = async (yearly: number | null, monthly: number | null) => {
    const userId = user.value?.id
    if (!userId) return

    const { error } = await supabase
      .from('profiles')
      .upsert(
        { id: userId, yearly_target: yearly, monthly_target: monthly },
        { onConflict: 'id' }
      )

    if (error) throw error

    yearlyTarget.value = yearly
    monthlyTarget.value = monthly
  }

  return {
    user,
    role,
    roleStatus,
    ready,
    loading,
    yearlyTarget,
    monthlyTarget,
    favoriteChartKeys,
    incomeTypeConfigs,
    initAuth,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateTargets,
    updateIncomeTypeConfigs,
  }
})