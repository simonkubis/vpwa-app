<template>
  <q-dialog v-model="isOpen">
    <q-card dark style="width: 100%; max-width: 500px; background: #525252;">
      <q-card-section class="text-h6">
        User Preferences
      </q-card-section>

      <q-card-section>
        <!-- Status selection -->
        <div class="q-mb-md">
          <q-select v-model="status" :options="statusOptions" option-value="value" option-label="label" emit-value
            map-options label="Status" color="teal-7" filled dense dark />
        </div>

        <!-- Notification preference -->
        <div class="q-mb-md">
          <q-select v-model="notifPref" :options="notifOptions" option-value="value" option-label="label" emit-value
            map-options label="Notifications" color="teal-7" filled dense dark />
        </div>


      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="teal-7" @click="close" />
        <q-btn unelevated color="teal-7" label="Save" @click="saveAndClose" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['settings-changed'])

const isOpen = ref(false)
const status = ref('online')
const notifPref = ref('all')
const API_URL = import.meta.env.VITE_API_URL


const statusOptions = [
  { label: 'Online', value: 'online' },
  { label: 'Offline', value: 'offline' },
  { label: 'Do Not Disturb', value: 'dnd' },
]

const notifOptions = [
  { label: 'All', value: 'all' },
  { label: 'Mentions Only', value: 'mentions_only' },
  { label: 'None', value: 'none' },
]

async function fetchSettings() {
  try {
    const res = await axios.get(`${API_URL}/settings`, {
     headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      }
    })

    return res.data
  } catch (err) {
    console.error('Failed to fetch settings:', err)
    throw err
  }
}

async function uploadSettings(newSettings) {
  try {
    await axios.put(`${API_URL}/settings`, newSettings, {
     headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      }
    })
  } catch (err) {
    console.error('Failed to upload settings:', err)
    throw err
  }
}

// --- Dialog controls ---
function open() {
  isOpen.value = true
  loadSettings()
}

function close() {
  isOpen.value = false
}

// --- Load saved settings ---
async function loadSettings() {
  const settings = await fetchSettings()
  status.value = settings.status
  notifPref.value = settings.notifPref
}

// --- Save settings ---
async function saveAndClose() {
  const newSettings = {
    status: status.value,
    notifPref: notifPref.value,
  }

  await uploadSettings(newSettings)
  emit('settings-changed', newSettings)
  close()
}

defineExpose({ open, loadSettings })
</script>
