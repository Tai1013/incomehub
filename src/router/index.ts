import { createRouter, createWebHashHistory } from 'vue-router'
import { supabase } from '../lib/supabase'
import { useLoading } from '../composables/useLoading'

const { load, unLoad } = useLoading()

const router = createRouter({
  history: createWebHashHistory(import.meta.env.VITE_APP_BASE),
  scrollBehavior(to) {
    if (to.hash) {
      const header = document.querySelector('.app-header') as HTMLElement | null
      const headerHeight = header?.offsetHeight ?? 52
      return {
        el: to.hash,
        top: headerHeight + 12,
        behavior: 'smooth',
      }
    }
    return { top: 0 }
  },
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { guestOnly: true },
    },
    {
      path: '/',
      component: () => import('../views/AppLayoutView.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          redirect: '/home',
        },
        {
          path: 'home',
          name: 'home',
          component: () => import('../views/HomeView.vue'),
        },
        {
          path: 'list',
          name: 'list',
          component: () => import('../views/ListView.vue'),
        },
        {
          path: 'data',
          name: 'data',
          component: () => import('../views/DataView.vue'),
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue'),
        },
        {
          path: 'income/list',
          redirect: '/list',
        },
        {
          path: 'stats',
          redirect: '/data',
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/home',
    },
  ],
})

router.beforeEach(async (to) => {
  load()
  let session = null

  try {
    const {
      data: { session: nextSession },
    } = await supabase.auth.getSession()
    session = nextSession
  } finally {
    unLoad()
  }

  const isAuthed = Boolean(session?.user)
  const needsAuth = to.matched.some((record) => record.meta.requiresAuth)
  const guestOnly = to.matched.some((record) => record.meta.guestOnly)

  if (needsAuth && !isAuthed) {
    return '/login'
  }

  if (guestOnly && isAuthed) {
    return '/home'
  }

  return true
})

export default router
