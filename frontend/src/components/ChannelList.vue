<template>
  <q-list dense>
    <q-item class="bg-teal-4 rounded-borders q-pa-none q-mb-sm" clickable tag="a" :href="props.link"
      style="position: relative;">
      <q-item-section class="q-py-sm q-px-xs" style="padding-right: 100px;">
        <q-item-label class="text-white">{{ props.title }}</q-item-label>
      </q-item-section>
      <q-btn class="absolute-right" icon="delete" color="white" size="sm" flat
        style="right:50px; z-index: 1;" @click="emit('delete')" />
      <q-btn class="absolute-right" icon="exit_to_app" color="white" size="sm" flat
        style="right:0px; z-index: 1;" />
    </q-item>
  </q-list>
</template>

<script setup>
const props = defineProps({
  title: {
    type: String,
    required: true
  }
})
const emit = defineEmits(['delete'])
</script>
