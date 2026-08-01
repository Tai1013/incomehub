import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/income/list',
    },
    {
      path: '/income/new',
      name: 'income-new',
      redirect: '/income/list',
    },
    {
      path: '/income/list',
      name: 'income-list',
      component: () => import('../views/DailyListView.vue'),
    },
    {
      path: '/stats',
      name: 'stats',
      component: () => import('../views/StatsView.vue'),
    },
  ],
})

export default router
