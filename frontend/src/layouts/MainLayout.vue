<template>
  <q-layout view="lHh Lpr lFf">
    
    <app-header @toggle-drawer="toggleLeftDrawer" />

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      
      <user-profile-header />

      <create-channel-bar />

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
import { ref } from 'vue'
import ChannelList from 'src/components/ChannelList.vue'
import AppHeader from 'src/components/AppHeader.vue'
import UserProfileHeader from 'src/components/UserProfileHeader.vue'
import CreateChannelBar from 'src/components/CreateChannelBar.vue'

// tieto data budeme brat z BE

const pinnedChannelsList = ref([
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov1'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov2'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov3'
  },
  {
    title: 'som pinned a soooooom straaaasne dlllllhy naaazov4'
  }
])

const privateChannelsList = ref([
  {
    title: 'som private'
  }
])

const publicChannelsList = ref([
  {
    title: 'som public'
  }
])

// toto spravime lepsie cez idcka
function deleteChannel(channel, type) {
  const listMap = {
    pinned: pinnedChannelsList,
    private: privateChannelsList,
    public: publicChannelsList
  }
  listMap[type].value = listMap[type].value.filter(c => c.title !== channel.title)
}

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
