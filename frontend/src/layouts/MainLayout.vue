<template>
  <q-layout view="lHh Lpr lFf">
    
    <app-header @toggle-drawer="toggleLeftDrawer" />

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered>
      <div class="q-pa-md row items-center justify-between">
        <div class="row items-center">
          <q-avatar size="42px" class="bg-grey-3 text-teal-7">
            <q-icon name="person" size="28px" />
          </q-avatar>
          <div class="text-subtitle2 q-ml-md">{username}</div>
        </div>
        <div class="row items-center">
          <q-btn icon="settings" flat round color="teal-7" size="md" aria-label="User Preferences" class="q-mr-xs">
          </q-btn>
          <q-btn icon="logout" flat round color="teal-7" size="md" aria-label="Logout">
          </q-btn>
        </div>
      </div>

      <q-list class="q-pa-md">
        <q-item-label header>
          Topped channels
        </q-item-label>
        <ChannelList v-for="channel in toppedChannelsList" :key="channel.title" v-bind="channel" />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label header>
          Private channels
        </q-item-label>
        <ChannelList v-for="channel in privateChannelsList" :key="channel.title" v-bind="channel" />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label header>
          Public channels
        </q-item-label>
        <ChannelList v-for="channel in publicChannelsList" :key="channel.title" v-bind="channel" />
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

// tieto data budeme brat z BE

const toppedChannelsList = [
  {
    title: 'som pinned'
  }
]

const privateChannelsList = [
  {
    title: 'som private'
  }
]

const publicChannelsList = [
  {
    title: 'som public'
  }
]

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}
</script>
