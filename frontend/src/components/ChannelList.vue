<template>
  <q-list dense>
    <q-item class="bg-teal-4 rounded-borders" clickable tag="a" :href="props.link">
      <q-item-section class="q-py-sm q-px-xs ">
        <q-item-label class="text-white">{{ props.title }}</q-item-label>
      </q-item-section>
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
</script>
