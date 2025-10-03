<template>
    <q-header class="bg-teal-7">
        <q-toolbar>
            <q-btn v-if="showMenu" flat dense round icon="menu" aria-label="Menu" @click="$emit('toggle-drawer')" />
            <q-toolbar-title>
                Smack
            </q-toolbar-title>
        </q-toolbar>
    </q-header>
</template>

<script setup>
defineProps({
  showMenu: { type: Boolean, default: true }
})
</script>