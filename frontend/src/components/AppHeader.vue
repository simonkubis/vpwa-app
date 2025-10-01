<template>
    <q-header class="bg-teal-7">
        <q-toolbar>
            <!-- Show menu button only if enabled -->
            <q-btn v-if="showMenu" flat dense round icon="menu" aria-label="Menu" @click="$emit('toggle-drawer')" />
            <q-toolbar-title>
                Chat App
            </q-toolbar-title>
        </q-toolbar>
    </q-header>
</template>

<script setup>
defineProps({
  showMenu: { type: Boolean, default: true }
})
</script>