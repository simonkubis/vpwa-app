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
        <q-menu transition-show="jump-down" transition-hide="jump-up">
          <q-list style="min-width: 180px">
            <q-item clickable v-ripple @click="onViewDetails">
              <q-item-section avatar>
                <q-icon name="info" />
              </q-item-section>
              <q-item-section>View channel details</q-item-section>
            </q-item>

            <q-item clickable v-ripple @click="onEditNotifications">
              <q-item-section avatar>
                <q-icon name="notifications" />
              </q-item-section>
              <q-item-section>Edit notifications</q-item-section>
            </q-item>

            <q-separator />

            <q-item clickable v-ripple @click="onTogglePin">
              <q-item-section avatar>
                <q-icon :name="pinned ? 'push_pin' : 'push_pin'" />
              </q-item-section>
              <q-item-section>
                {{ pinned ? 'Unpin channel' : 'Pin channel' }}
              </q-item-section>
            </q-item>
          </q-list>
        </q-menu>
      </q-btn>
    </div>

    <!-- members list -->
    <q-dialog v-model="membersListOpen">
      <q-card style="min-width: 320px;">
        <q-card-section class="row items-center justify-between">
          <div class="text-subtitle1">Members — #{{ channelName }}</div>
          <q-btn dense flat round icon="close" v-close-popup />
        </q-card-section>

        <q-separator />

        <q-list separator>
          <q-item v-for="(m, i) in members" :key="i">
            <q-item-section avatar>
              <q-avatar>
                <img :src="m.avatar" :alt="m.nickName" />
              </q-avatar>
            </q-item-section>

            <q-item-section>
              <q-item-label>{{ m.nickName }}</q-item-label>
              <q-item-label caption>{{ m.status }}</q-item-label>
            </q-item-section>
          </q-item>
        </q-list>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup>
    import { ref, computed } from 'vue'

    const channelName = ref('general')
    const membersListOpen = ref(false)
    const pinned = ref(false)

    const members = ref([
    { nickName: 'alice', avatar: 'https://i.pravatar.cc/150?img=1', status: 'online' },
    { nickName: 'bob', avatar: 'https://i.pravatar.cc/150?img=2', status: 'dnd' },
    { nickName: 'charlie', avatar: 'https://i.pravatar.cc/150?img=3', status: 'offline' },
    { nickName: 'diana', avatar: 'https://i.pravatar.cc/150?img=4', status: 'online' },
    { nickName: 'ed', avatar: 'https://i.pravatar.cc/150?img=5', status: 'online' }
    ])

    const displayedMembers = computed(() => members.value.slice(0, 3))

    // dummy menu handlers
    function onViewDetails() {
    console.log(`Viewing details for channel #${channelName.value}`)
    }
    function onEditNotifications() {
    console.log(`Editing notifications for channel #${channelName.value}`)
    }
    function onTogglePin() {
    pinned.value = !pinned.value
    console.log(`${pinned.value ? 'Pinned' : 'Unpinned'} channel #${channelName.value}`)
    }
</script>

<style scoped>
    .members-btn {
    border-radius: 10px;
    min-height: 34px;
    }
    .avatar-stack {
    position: relative;
    }
    .avatar-overlap {
    margin-left: -10px;
    }
    .avatar-overlap:first-child {
    margin-left: 0;
    }
</style>
