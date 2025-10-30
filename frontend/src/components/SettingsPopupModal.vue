<template>
  <q-dialog v-model="isOpen">
    <q-card dark style="width: 100%; max-width: 500px; background: #525252;">
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
import { ref, onMounted } from 'vue'

const emit = defineEmits(['dnd-changed'])

const isOpen = ref(false)
const dndEnabled = ref(false)

function open() {
  isOpen.value = true
}

function close() {
  isOpen.value = false
}

function saveAndClose() {  
  localStorage.setItem('dndEnabled', dndEnabled.value ? '1' : '0')
  emit('dnd-changed', dndEnabled.value)
  close()
}

onMounted(() => {
  const val = localStorage.getItem('dndEnabled')
  if (val !== null) dndEnabled.value = val === '1'
})

defineExpose({ open, dndEnabled })
</script>