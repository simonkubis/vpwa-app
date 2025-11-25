<template>
  <q-list dense>
    <q-item
      :class="[
        'rounded-borders q-pa-none q-mb-sm channel-item', 
        is_invited ? 'bg-indigo-5' : 'bg-teal-4'
      ]"
      :to="!is_invited ? { path: `/channel/${channel_id}` } : null"
      
      :clickable="!is_invited"
    >
      <q-item-section class="q-py-sm q-px-xs main-section" :style="rightPadStyle">
        <q-item-label class="text-white channel-title" :title="`#${name}`">
          # {{ name }}
        </q-item-label>
      </q-item-section>

      <template v-if="!invites">
        <!-- If invited: Accept / Decline -->
        <template v-if="is_invited">
          <q-btn
            class="absolute-right"
            icon="check"
            color="white"
            size="sm"
            flat
            style="right:50px; z-index: 1;"
            @click.stop.prevent="emit('accept')"
          >
            <q-tooltip>Accept invitation</q-tooltip>
          </q-btn>

          <q-btn
            class="absolute-right"
            icon="close"
            color="white"
            size="sm"
            flat
            style="right:0px; z-index: 1;"
            @click.stop.prevent="emit('decline')"
          >
            <q-tooltip>Decline invitation</q-tooltip>
          </q-btn>
        </template>

        <template v-else>
          <q-btn
            v-if="is_admin"
            class="absolute-right"
            icon="delete"
            color="white"
            size="sm"
            flat
            style="right:50px; z-index: 1;"
            @click.stop.prevent="emit('delete')"
          >
            <q-tooltip>Delete channel</q-tooltip>
          </q-btn>

          <q-btn
            class="absolute-right"
            icon="exit_to_app"
            color="white"
            size="sm"
            flat
            style="right:0px; z-index: 1;"
            @click.stop.prevent="emit('leave')"
          >
            <q-tooltip>Leave channel</q-tooltip>
          </q-btn>
        </template>
      </template>
    </q-item>
  </q-list>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  name: { type: String, required: true },
  link: { type: String, default: '#' },
  id: { type: String, required: true },
  channel_id: { type: String, required: true },
  is_invited: { type: Boolean, default: false },
  is_pinned: { type: Boolean, default: false },
  is_admin: { type: Boolean, default: false }
})

const emit = defineEmits(['delete', 'leave', 'accept', 'decline'])

const rightPadStyle = computed(() => {
  if (props.invites) return 'padding-right: 0;'
  if (props.is_invited) return 'padding-right: 100px;' // two buttons for invites
  if (props.canDelete && props.canLeave) return 'padding-right: 100px;'
  if (props.canDelete || props.canLeave) return 'padding-right: 50px;'
  return 'padding-right: 0;'
})
</script>

<style scoped>
.channel-title {
  display: -webkit-box;
  -webkit-line-clamp: 2;    
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;        
  word-break: break-word;     
}

.main-section {
  min-width: 0;
}

.channel-item {
  overflow: hidden;
}
</style>
