<template>
  <div class="row items-center justify-between bg-teal-5 text-white q-pa-sm rounded-borders">
    <div class="text-h6"># {{ channelName }}</div>

    <div class="row items-center no-wrap">
      <!-- members -->
      <q-btn
        flat
        class="q-px-sm members-btn bg-teal-6 q-mr-sm"
        :ripple="false"
        @click="membersListOpen = true"
      >
        <div class="row items-center no-wrap">
          <div class="row items-center avatar-stack">
            <q-avatar
              v-for="(m, i) in displayedMembers"
              :key="i"
              size="28px"
              class="avatar-overlap"
            >
              <img :src="m.avatar" :alt="m.nickName" />
            </q-avatar>
          </div>
          <div class="q-ml-sm text-weight-medium">{{ members.length }}</div>
        </div>
      </q-btn>

      <!-- 3 dots menu -->
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

            <q-item clickable v-ripple @click="onEditNotifications">
              <q-item-section avatar><q-icon name="notifications" /></q-item-section>
              <q-item-section>Edit notifications</q-item-section>
            </q-item>

            <q-separator color="grey-7" />

            <q-item clickable v-ripple @click="onTogglePin">
              <q-item-section avatar><q-icon :name="pinned ? 'push_pin' : 'push_pin'" /></q-item-section>
              <q-item-section>{{ pinned ? 'Unpin channel' : 'Pin channel' }}</q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- members list -->
    <q-dialog v-model="membersListOpen">
      <q-card class="dialog-525" style="min-width: 320px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1">Members — #{{ channelName }}</div>
          <q-btn dense flat round icon="close" v-close-popup class="text-grey-3" />
        </q-card-section>

        <q-separator color="grey-7" />

        <q-list separator>
          <q-item v-for="(m, i) in members" :key="i" clickable>
            <q-item-section avatar>
              <q-avatar>
                <img :src="m.avatar" :alt="m.nickName" />
              </q-avatar>
            </q-item-section>
            <q-item-section>
              <q-item-label class="text-white">{{ m.nickName }}</q-item-label>
              <q-item-label caption class="text-grey-4">{{ m.status }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>

    <!-- channel details -->
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
              # {{ details.title }}
              <q-chip dense square class="chip-525" text-color="white" dark>
                {{ details.visibility === 'private' ? 'Private' : 'Public' }}
              </q-chip>
            </div>
            <div class="text-body2 text-grey-3" v-if="details.description">
              {{ details.description }}
            </div>

            <div class="row items-center q-mt-sm">
              
            </div>

            <div class="q-mt-md">
              <div><span class="text-weight-medium text-grey-4">Owner:</span> <span class="text-white">{{ details.ownerName }}</span></div>
              <div>
                <span class="text-weight-medium text-grey-4">Created:</span>
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
import { ref, computed, inject } from 'vue'
import { date } from 'quasar'
import { defineExpose } from 'vue'

const props = defineProps({
  channelName: { type: String, required: true }
})

const getChannelMeta = inject('getChannelMeta', () => null)

const membersListOpen = ref(false)
const pinned = ref(false)
const detailsOpen = ref(false)

const members = ref([
  { nickName: 'alice', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online' },
  { nickName: 'bob', avatar: 'https://i.pravatar.cc/150?img=2', status: 'dnd' },
  { nickName: 'charlie', avatar: 'https://i.pravatar.cc/150?img=3', status: 'offline' },
  { nickName: 'diana', avatar: 'https://i.pravatar.cc/150?img=4', status: 'online' },
  { nickName: 'ed', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online' }
])

const displayedMembers = computed(() => members.value.slice(0, 3))

function openMembersList () {
  membersListOpen.value = true
}

const details = computed(() => {
  const meta = getChannelMeta(props.channelName)
  return meta || {
    title: props.channelName,
    description: '',
    visibility: 'public',
    ownerName: 'unknown',
    createdAt: new Date().toISOString()
  }
})
const formattedCreatedAt = computed(() =>
  details.value?.createdAt
    ? date.formatDate(details.value.createdAt, 'YYYY-MM-DD HH:mm')
    : '-'
)

function onViewDetails() {
  detailsOpen.value = true
}
function onEditNotifications() {
  console.log(`Editing notifications for channel #${props.channelName}`)
}
function onTogglePin() {
  pinned.value = !pinned.value
  console.log(`${pinned.value ? 'Pinned' : 'Unpinned'} channel #${props.channelName}`)
}

defineExpose({ openMembersList })

</script>

<style scoped>
.members-btn { border-radius: 10px; min-height: 34px; }
.avatar-stack { position: relative; }
.avatar-overlap { margin-left: -10px; }
.avatar-overlap:first-child { margin-left: 0; }



</style>

<style>
.dialog-525 {
  background-color: #525252;
  color: #fff;
  border-radius: 12px;
}

.chip-525 {
  background-color: #616161; 
}

.menu-525 {
  background-color: #525252 !important;
  color: #fff !important;
  border-radius: 10px;
  min-width: 200px;
  overflow: hidden;
}


.menu-525 .q-item,
.menu-525 .q-item__label,
.menu-525 .q-icon {
  color: #fff !important;
}


.menu-525 .q-item--active,
.menu-525 .q-item:hover {
  background-color: rgba(255,255,255,0.08);
}
</style>