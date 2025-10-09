<template>
  <q-layout view="lHh Lpr lFf">
    
    <app-header @toggle-drawer="toggleLeftDrawer" />

    <q-drawer
      v-model="leftDrawerOpen"
      elevated
      show-if-above
      class="custom-drawer"
      :style="{ backgroundColor: '#393939', color: '#fff' }" 
    >
      <user-profile-header />

      <create-channel-bar />
      <q-list v-if="inviteChannelsList.length" class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Invites
        </q-item-label>
        <ChannelList
          v-for="channel in inviteChannelsList"
          :key="channel.title"
          v-bind="channel"
          invites
          @delete="deleteChannel(channel, 'pinned')"
        />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Pinned channels
        </q-item-label>
        <ChannelList v-for="channel in pinnedChannelsList" :key="channel.title" v-bind="channel" @delete="deleteChannel(channel, 'pinned')" />
      </q-list>

      <q-list class="q-pa-md" >
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Private channels
        </q-item-label>
        <ChannelList v-for="channel in privateChannelsList" :key="channel.title" v-bind="channel" @delete="deleteChannel(channel, 'private')" />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Public channels
        </q-item-label>
        <ChannelList v-for="channel in publicChannelsList" :key="channel.title" v-bind="channel" @delete="deleteChannel(channel, 'public')" />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, provide } from 'vue'
import ChannelList from 'src/components/ChannelList.vue'
import AppHeader from 'src/components/AppHeader.vue'
import UserProfileHeader from 'src/components/UserProfileHeader.vue'
import CreateChannelBar from 'src/components/CreateChannelBar.vue'

// tieto data budeme brat z BE

const inviteChannelsList = ref([
  {
    title: 'som public invite1',
    type: 'public',
    description: 'Welcome thread for newcomers.',
    visibility: 'public',
    ownerName: 'alice',
    createdAt: '2025-09-20T09:15:00Z'
  },
  {
    title: 'som private invite2',
    type: 'private',
    description: 'Core team planning.',
    visibility: 'private',
    ownerName: 'bob',
    createdAt: '2025-09-28T12:40:00Z'
  }
])

const pinnedChannelsList = ref([
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov1',
    description: 'release coordination.',
    visibility: 'public',
    ownerName: 'diana',
    createdAt: '2025-09-01T08:00:00Z'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov2',
    description: 'incident updates.',
    visibility: 'public',
    ownerName: 'charlie',
    createdAt: '2025-09-05T10:30:00Z'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov3',
    description: 'design reviews.',
    visibility: 'private',
    ownerName: 'ed',
    createdAt: '2025-09-07T14:00:00Z'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaasdagfasdrghasdgasdgasgzov4',
    description: 'community notes.',
    visibility: 'public',
    ownerName: 'alice',
    createdAt: '2025-09-10T16:45:00Z'
  }
])

const privateChannelsList = ref([
  {
    title: 'som private',
    description: 'Private backlog grooming.',
    visibility: 'private',
    ownerName: 'bob',
    createdAt: '2025-09-15T09:00:00Z'
  }
])

const publicChannelsList = ref([
  {
    title: 'som public',
    description: 'General discussion.',
    visibility: 'public',
    ownerName: 'alice',
    createdAt: '2025-09-12T13:20:00Z'
  }
])

function getMembership(title) {
  return inviteChannelsList.value.some(c => c.title === title)
    ? 'invited'
    : 'member'
}

function joinChannel(title) {
  const channel = inviteChannelsList.value.find(c => c.title === title)
  if (!channel) return

  inviteChannelsList.value = inviteChannelsList.value.filter(c => c.title !== title)

  if (channel.type === 'private') {
    privateChannelsList.value.push(channel)
  } else {
    publicChannelsList.value.push(channel)
  }
}

provide('getMembership', getMembership)
provide('joinChannel', joinChannel)
provide('getChannelMeta', getChannelMeta)

// toto spravime lepsie cez idcka
function deleteChannel(channel, type) {
  const listMap = {
    pinned: pinnedChannelsList,
    private: privateChannelsList,
    public: publicChannelsList
  }
  listMap[type].value = listMap[type].value.filter(c => c.title !== channel.title)
}

function getChannelMeta(title) {
  const lists = [
    ...inviteChannelsList.value,
    ...pinnedChannelsList.value,
    ...privateChannelsList.value,
    ...publicChannelsList.value
  ]
  return lists.find(c => c.title === title) || null
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>

<style scoped>
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #2c2c2c;
}

::-webkit-scrollbar-thumb {
  background-color: #555; 
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: #777;
}

* {
  scrollbar-width: thin;
  scrollbar-color: #555 #2c2c2c;
}
</style>