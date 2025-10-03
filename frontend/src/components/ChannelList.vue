<template>
  <q-list dense>
    <q-item
      :class="[
        'rounded-borders q-pa-none q-mb-sm channel-item', 
        invites ? 'bg-indigo-5' : 'bg-teal-4'
      ]"
      clickable
      :to="`/channel/${title}`" 
    >
      <q-item-section class="q-py-sm q-px-xs main-section" :style="rightPadStyle">
        <q-item-label class="text-white channel-title" :title="`# ${title}`">
          # {{ title }}
        </q-item-label>
      </q-item-section>

      <template v-if="!invites">    <!-- invites sa budu prijmat ze klikne na ten channel a klikne join https://share.google/images/t6JhWnUYXarRQEZZW-->
        <q-btn      
          v-if="canDelete"
          class="absolute-right"
          icon="delete"
          color="white"
          size="sm"
          flat
          style="right:50px; z-index: 1;"
          @click.stop.prevent="emit('delete')"
        > <!--iba admin-->
          <q-tooltip>Delete channel</q-tooltip>
        </q-btn>

        <!-- Leave (any member) -->
        <q-btn
          v-if="canLeave"
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
    </q-item>
  </q-list>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  title: { type: String, required: true },
  link: { type: String, default: '#' },


  invites: { type: Boolean, default: false },


  canDelete: { type: Boolean, default: false },   // ak admin tak bude true
  canLeave: { type: Boolean, default: true }    
})

const emit = defineEmits(['delete', 'leave'])

const rightPadStyle = computed(() => {
  if (props.invites) return 'padding-right: 0;'
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
