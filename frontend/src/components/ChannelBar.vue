<template>
  <div class="row items-center justify-between bg-teal-5 text-white q-pa-sm rounded-borders">
    <!-- Channel Name -->
    <div class="text-h6"># {{ channelName }}</div>

    <!-- Actions: Members + Menu -->
    <div class="row items-center no-wrap">
      <!-- Members button -->
      <q-btn
        flat
        class="q-px-sm members-btn bg-teal-6 q-mr-sm"
        :ripple="false"
        @click="membersListOpen = true"
      >
        <div class="row items-center no-wrap">
          <div class="row items-center avatar-stack">
            <q-avatar
              v-for="(m, i) in displayedMembers.filter(x => !x.isBanned).length"
              :key="i"
              size="28px"
              class="avatar-overlap"
            >
              <img :src="m.avatar || defaultAvatar(i)" :alt="m.username" />
            </q-avatar>
          </div>
          <div class="q-ml-sm text-weight-medium">{{ members.filter(x => !x.isBanned).length }}</div>
        </div>
      </q-btn>

      <!-- More menu -->
      <q-btn flat round dense icon="more_vert" class="text-white">
        <q-menu
          class="menu-525 text-white"
          :content-style="{ borderRadius: '10px', overflow: 'hidden' }"
          transition-show="jump-down"
          transition-hide="jump-up"
        >
          <q-list separator>
            <q-item clickable v-ripple @click="onViewDetails">
              <q-item-section avatar><q-icon name="info" /></q-item-section>
              <q-item-section>View channel details</q-item-section>
            </q-item>

            <q-separator color="grey-7" />

            <q-item clickable v-ripple @click="onTogglePin">
              <q-item-section avatar>
                <q-icon name="push_pin" />
              </q-item-section>
              <q-item-section>{{ localPinned ? 'Unpin channel' : 'Pin channel' }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- Members List Dialog -->
    <q-dialog v-model="membersListOpen">
      <q-card class="dialog-525" style="min-width: 320px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1">Members — #{{ channelName }}</div>
          <q-btn dense flat round icon="close" v-close-popup class="text-grey-3" />
        </q-card-section>

        <q-separator color="grey-7" />

        <q-list separator>
          <q-item v-for="(m, i) in members.filter(x => !x.isBanned)" :key="i" clickable>
            <q-item-section avatar>
              <q-avatar>
                <img :src="m.avatar || defaultAvatar(i)" :alt="m.nickname" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-white">{{ m.nickname }}</q-item-label>
              <q-item-label caption class="text-grey-4">
                {{ m.isInvited ? 'Invited' : m.isAdmin ? 'Admin' : 'Member' }}
              </q-item-label>
              <q-item-label caption class="text-grey-4">
                Status: {{ m.status  }} 
              </q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- Channel Details Dialog -->
    <q-dialog v-model="detailsOpen">
      <q-card class="dialog-525" style="width: 100%; max-width: 420px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1">Channel details</div>
          <q-btn dense flat round icon="close" v-close-popup class="text-grey-3" />
        </q-card-section>

        <q-separator color="grey-7" />

        <q-card-section>
          <div class="q-gutter-sm">
            <div class="text-h6 text-white">
              # {{ channelName }}
              <q-chip dense square class="chip-525" text-color="white" dark>
                {{ channelMeta.visibility === 'private' ? 'Private' : 'Public' }}
              </q-chip>
            </div>
            <div class="text-body2 text-grey-3" v-if="channelMeta.description">
              {{ channelMeta.description }}
            </div>

            <div class="q-mt-md">
              <div>
                <span class="text-weight-medium text-grey-4">Owner: </span>
                <span class="text-white">{{ channelMeta.ownerName.ownerName || 'unknown' }}</span>
              </div>
              <div>
                <span class="text-weight-medium text-grey-4">Created: </span>
                <span class="text-white">{{ formattedCreatedAt }}</span>
              </div>
            </div>
          </div>
        </q-card-section>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
import { ref, computed, defineExpose, inject, watch } from 'vue'
import { date } from 'quasar'
import axios from 'axios'



const props = defineProps({
  channelMeta: { type: Object, default: () => ({}) },
  membership: { type: Object, default: () => ({}) },
  members: { type: Array, default: () => [] }
})

const API_URL = import.meta.env.VITE_API_URL

const loadChannels = inject('loadChannels')


// Dialogs
const membersListOpen = ref(false)
const detailsOpen = ref(false)

// Pinned state
const localPinned = ref(false);

watch(
  () => props.membership?.isPinned,
  (val) => {
    localPinned.value = val ?? false;
  },
  { immediate: true }
);

watch(
  () => props.channelMeta,
  (newMeta) => {
    console.log("Channel meta updated!", newMeta);
  },
  { deep: true }
);

// Computed
const channelName = computed(() => props.channelMeta?.name || 'Unnamed')
const displayedMembers = computed(() => props.members.slice(0, 5))
const formattedCreatedAt = computed(() =>
  props.channelMeta?.createdAt
    ? date.formatDate(props.channelMeta.createdAt, 'YYYY-MM-DD HH:mm')
    : '-'
)



// Default avatar for missing images
function defaultAvatar(index) {
  return `https://i.pravatar.cc/150?img=${index + 1}`
}

// Actions
function onViewDetails() {
  detailsOpen.value = true
}

async function onTogglePin() {
  try {
    const newState = !localPinned.value;
    await axios.post(
      `${API_URL}/channels/pin`,
      { channelId: props.channelMeta.id, isPinned: newState },
      { headers: { Authorization: `Bearer ${localStorage.getItem('auth.token')}` } }
    );

    localPinned.value = newState;
    loadChannels()
  } catch (err) {
    console.error('Failed to toggle pin:', err);
  }
}


defineExpose({ openMembersList: () => { membersListOpen.value = true } })
</script>

<style scoped>
.members-btn { border-radius: 10px; min-height: 34px; }
.avatar-stack { position: relative; }
.avatar-overlap { margin-left: -10px; }
.avatar-overlap:first-child { margin-left: 0; }
</style>

<style>
.dialog-525 { background-color: #525252; color: #fff; border-radius: 12px; }
.chip-525 { background-color: #616161; }
.menu-525 { background-color: #525252 !important; color: #fff !important; border-radius: 10px; min-width: 200px; overflow: hidden; }
.menu-525 .q-item, .menu-525 .q-item__label, .menu-525 .q-icon { color: #fff !important; }
.menu-525 .q-item--active, .menu-525 .q-item:hover { background-color: rgba(255,255,255,0.08); }
</style>
