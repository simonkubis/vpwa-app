<template>
  <div class="q-pa-md row items-center no-wrap">
    <q-avatar size="42px" class="bg-grey-3 text-teal-7">
      <q-icon name="person" size="28px" />
    </q-avatar>

    <div class="q-ml-md column col" style="min-width: 0;">
      <div class="text-subtitle2 ellipsis" style="display:block; width:100%;" :title="nickname">
        {{ nickname }}
      </div>

      <div class="text-caption text-grey-6 row items-center">
        <q-icon name="circle" size="10px" class="q-mr-xs" :color="dndEnabled ? 'grey-5' : 'teal-5'" />
        {{ dndEnabled ? 'DnD' : 'Online' }}
      </div>
    </div>

    <div class="row items-center no-wrap" style="flex:0 0 auto;">
      <q-btn icon="settings" flat round class="q-mr-xs" @click="openSettings" />
      <q-btn icon="logout" flat round @click="logout" />
    </div>
  </div>

  <q-separator />
  <SettingsPopupModal ref="settingsModal" @dnd-changed="dndEnabled = $event" />
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from "vue";
import SettingsPopupModal from "src/components/SettingsPopupModal.vue";
import { useRouter } from 'vue-router'

const router = useRouter()

const settingsModal = ref(null);
const dndEnabled = ref(localStorage.getItem('dndEnabled') === '1')
const nickname = ref('Guest')

function readNickname() {
  try {
    const u = JSON.parse(localStorage.getItem('auth.user') || 'null')
    nickname.value = u?.nickname || 'Guest'
  } catch { nickname.value = 'Guest' }
}

function onAuthChanged(e) {
  const user = e.detail
  nickname.value = user?.nickname || 'Guest'
}

onMounted(() => {
  readNickname()
  window.addEventListener('auth:changed', onAuthChanged)
})

onBeforeUnmount(() => {
  window.removeEventListener('auth:changed', onAuthChanged)
})

function openSettings() {
  settingsModal.value.open();
}

async function logout() {

    const token = localStorage.getItem('auth.token')
    if (token) {
      await fetch(`${import.meta.env.VITE_API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      })
    }

    localStorage.removeItem('auth.token')
    localStorage.removeItem('auth.user')
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: null }))
    router.push('/login')
}

</script>