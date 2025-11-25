<template>
  <chat-window
    :channel-name="channelTitle"
    :membership="membership"
    @pinnedToggled="$emit('pinnedToggled')"
    @join="onJoin"
  />


</template>

<script setup>
import { computed, inject } from 'vue'
import { useRoute } from 'vue-router'
import ChatWindow from 'src/components/ChatWindow.vue'

const route = useRoute()
const getMembership = inject('getMembership')
const joinChannel   = inject('joinChannel')


const channelTitle = computed(() =>
  decodeURIComponent(route.params.title || 'general')
)
const membership = computed(() =>
  getMembership ? getMembership(channelTitle.value) : 'member'
)

function onJoin () {
  joinChannel && joinChannel(channelTitle.value)
}
</script>