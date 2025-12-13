export default [
  { 
    path: '/login',
    component: () => import('pages/LoginPage.vue'),
    meta: { guestOnly: true }
  },

  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    meta: { requiresAuth: true },
    children: [

      { path: '', component: () => import('pages/IndexPage.vue') },

     {
        path: 'channel/:id',
        name: 'channel',
        component: () => import('components/ChatWindow.vue'),
      }
    ],
  },

  { path: '/:catchAll(.*)*', component: () => import('pages/ErrorNotFound.vue') },
]
