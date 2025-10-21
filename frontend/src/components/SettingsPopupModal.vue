<template>
  <q-dialog v-model="isOpen">
    <q-card style="width: 100%; max-width: 500px;">
     <q-card-section class="text-h6">
        User Preferences
      </q-card-section>

      <q-card-section>
        <div class="q-mb-md">Settings content...</div>

        <!-- Do Not Disturb setting -->
        <q-toggle
          v-model="dndEnabled"
          label="Do Not Disturb"
          left-label
          color="teal-7"
          dense
        />
        <div class="text-caption text-grey-6 q-mt-xs">
          When enabled you won't receive visual notifications.
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
import { ref, onMounted, watch } from 'vue'

const isOpen = ref(false)
const dndEnabled = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function saveAndClose() {
  // persist setting (simple localStorage example)
  
  localStorage.setItem('dndEnabled', dndEnabled.value ? '1' : '0')

  close()
}

// initialize from storage
onMounted(() => {
  const val = localStorage.getItem('dndEnabled')
  if (val !== null) dndEnabled.value = val === '1'
})

// keep storage in sync when toggled
watch(dndEnabled, (v) => {
  localStorage.setItem('dndEnabled', v ? '1' : '0')
})

defineExpose({ open, dndEnabled })
</script>