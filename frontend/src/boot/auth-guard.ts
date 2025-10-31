import { boot } from 'quasar/wrappers'

export default boot(({ router }) => {
  router.beforeEach((to) => {
    const token = localStorage.getItem('auth.token')

    const requiresAuth = to.matched.some(r => r.meta.requiresAuth)
    const guestOnly    = to.matched.some(r => r.meta.guestOnly)

    if (requiresAuth && !token) {
      return { path: '/login', query: { redirect: to.fullPath } }
    }

    if ((guestOnly || to.path === '/login') && token) {
      return { path: '/' }
    }
  })
})