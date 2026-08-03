import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'
import { useLoading } from '../composables/useLoading'

export const useAuthStore = defineStore('auth', () => {
  const { load, unLoad } = useLoading()
  const user = ref<User | null>(null)
  const role = ref('user')
  const roleStatus = ref<'idle' | 'loaded' | 'missing' | 'error'>('idle')
  const ready = ref(false)
  const loading = ref(false)
  const yearlyTarget = ref<number | null>(null)
  const monthlyTarget = ref<number | null>(null)
  let initialized = false
  let roleRequestUserId: string | null = null

  const loadRole = async (userId: string | undefined) => {
    if (!userId) {
      role.value = 'user'
      roleStatus.value = 'idle'
      roleRequestUserId = null
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
        .select('role, yearly_target, monthly_target')
        .eq('id', userId)
        .maybeSingle()

      if (error) {
        console.error('Failed to load profile role', error)
        role.value = 'user'
        roleStatus.value = 'error'
        return
      }

      if (!data?.role) {
        role.value = 'user'
        roleStatus.value = 'missing'
        return
      }

      role.value = normalizeRole(data.role)
      yearlyTarget.value = data.yearly_target ?? null
      monthlyTarget.value = data.monthly_target ?? null
      roleStatus.value = 'loaded'
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
    } finally {
      loading.value = false
      unLoad()
    }
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
    initAuth,
    signUpWithEmail,
    signInWithEmail,
    signOut,
    updateTargets,
  }
})