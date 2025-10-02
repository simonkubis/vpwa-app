<template>
  <q-dialog v-model="isOpen">
    <q-card style="min-width: 500px;">
      <q-card-section class="text-h6">
        User Preferences
      </q-card-section>

      <q-card-section>
        <!-- Your settings form/inputs go here -->
        <div>Settings content...</div>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Close" color="teal-7" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref } from "vue";

const isOpen = ref(false);

// This function allows the parent to control opening
function open() {
  isOpen.value = true;
}

defineExpose({ open });
</script>