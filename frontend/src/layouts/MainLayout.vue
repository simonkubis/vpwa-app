<template>
  <q-layout view="lHh Lpr lFf">

    <app-header @toggle-drawer="toggleLeftDrawer" />

    <q-drawer v-model="leftDrawerOpen" elevated show-if-above class="custom-drawer"
      :style="{ backgroundColor: '#393939', color: '#fff' }">
      <user-profile-header />

      <create-channel-bar @channelCreated="loadChannels" />
      <q-list v-if="inviteChannelsList.length" class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Invites
        </q-item-label>
        
        <ChannelList
          v-for="invite in inviteChannelsList"
          :key="invite.channel_id"
          v-bind="invite"
          @delete="deleteChannel(invite)"
          @accept="acceptInvite(invite)"
          @decline="declineInvite(invite)"
        />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Pinned channels
        </q-item-label>
        <ChannelList
          v-for="channel in pinnedChannelsList"
          :key="channel.id"
          v-bind="channel"
          @delete="deleteChannel(channel)"
          @leave="leaveChannel(channel)"
        />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Private channels
        </q-item-label>
        <ChannelList
          v-for="channel in privateChannelsList"
          :key="channel.id"
          v-bind="channel"
          @delete="deleteChannel(channel)"
          @leave="leaveChannel(channel)"
        />
      </q-list>

      <q-list class="q-pa-md">
        <q-item-label class="q-px-none text-subtitle2 q-mb-md">
          Public channels
        </q-item-label>
        <ChannelList
          v-for="channel in publicChannelsList"
          :key="channel.id"
          v-bind="channel"
          @delete="deleteChannel(channel)"
          @leave="leaveChannel(channel)"
        />
      </q-list>
    </q-drawer>

    <q-page-container>
      <router-view @pinnedToggled="loadChannels"/>
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref, onMounted, provide } from 'vue'
import ChannelList from 'src/components/ChannelList.vue'
import AppHeader from 'src/components/AppHeader.vue'
import UserProfileHeader from 'src/components/UserProfileHeader.vue'
import CreateChannelBar from 'src/components/CreateChannelBar.vue'
import axios from 'axios';


const API_URL = import.meta.env.VITE_API_URL

const inviteChannelsList = ref([])

const pinnedChannelsList = ref([])

const privateChannelsList = ref([])

const publicChannelsList = ref([])

const leftDrawerOpen = ref(false)


// Placeholder functions
async function acceptInvite(invite) {
  try {
    console.log('Accepting invite for channel:', invite.channel_id)

    await axios.post(
      `${API_URL}/channels/invite/accept`,
      { channelId: invite.channel_id },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    )

    // Reload channels after accepting invite
    await loadChannels()
  } catch (error) {
    console.error('Failed to accept invite:', error)
  }
}

async function declineInvite(invite) {
  try {
    console.log('Declining invite for channel:', invite.channel_id)

    await axios.delete(`${API_URL}/channels/invite/decline`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      },
      data: {
        channelId: invite.channel_id, // DELETE with body
      },
    })

    // Reload channels after declining invite
    await loadChannels()
  } catch (error) {
    console.error('Failed to decline invite:', error)
  }
}

async function revokeUser(channel, userNickname) {
  try {
    const channelId = channel.channel_id || channel.id
    console.log(`Revoking user ${userNickname} from channel:`, channelId)

    await axios.post(
      `${API_URL}/channels/revoke`,
      {
        channelId,
        nickname: userNickname,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    )

    await loadChannels()
    console.log(`User ${userNickname} successfully revoked from channel ${channelId}`)
  } catch (error) {
    console.error(`Failed to revoke user ${userNickname} from channel:`, error)
  }
}


async function leaveChannel(channel) {
  try {
    console.log('Leaving channel:', channel.channel_id || channel.id)

    await axios.delete(`${API_URL}/channels/leave`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      },
      data: {
        channelId: channel.channel_id || channel.id,
      },
    })

    // Refresh lists after leaving
    await loadChannels()
  } catch (error) {
    console.error('Failed to leave channel:', error)
  }
}

async function deleteChannel(channel) {
  try {
    console.log('Deleting channel:', channel.channel_id || channel.id)

    await axios.delete(`${API_URL}/channels/delete`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      },
      data: {
        channelId: channel.channel_id || channel.id,
      },
    })

    // Refresh after deletion
    await loadChannels()
  } catch (error) {
    console.error('Failed to delete channel:', error)
  }
}

async function kickUser(channel, userNickname) {
  try {
    const response = await axios.post(
      `${API_URL}/kicks`,
      {
        channelId: channel.channel_id || channel.id,
        nickname: userNickname, // send nickname instead of userId
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    );

    const data = response.data;
    const message = response.data.message;

    console.log(message, data);

    // Optional: refresh channels or members list after kick
    await loadChannels(); // or loadChannelMembers(channelId)

    return data;
  } catch (error) {
    if (error.response) {
      console.error('Kick failed:', error.response.data);
      alert(error.response.data.error || error.response.data.message);
    } else {
      console.error('Kick failed:', error);
      alert('Failed to kick user. Please try again.');
    }
  }
}

async function inviteToChannel(channelId, userNickname) {
  try {
    const response = await axios.post(
      `${API_URL}/channels/invite`,
      {
        channelId: channelId,
        nickname: userNickname,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    );

    const data = response.data.data;
    const message = response.data.message;

    console.log(message, data);

    // Refresh channels list after inviting
    await loadChannels();

    return data;
  } catch (error) {
    console.error('Failed to invite user to channel:', error);
  }
}




async function joinOrCreateChannel(channelName, visibility = 'public') {
  try {
    // Send POST request to join or create the channel
    const response = await axios.post(
      `${API_URL}/channels/join-or-create`,
      {
        name: channelName,
        visibility: visibility,
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    )

    const { channel, membership } = response.data.data || {}
    const message = response.data.message

    console.log(message, { channel, membership })

    await loadChannels()

    return { channel, membership }
  } catch (error) {
    console.error('Failed to join or create channel:', error)
  }
}

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}


async function loadChannels() {
  try {
    const response = await axios.get(`${API_URL}/channels/members`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
      },
    });

    const channels = response.data.data;
    console.log('Loaded channels:', channels);
    inviteChannelsList.value = channels.filter(channel => channel.is_invited);
    pinnedChannelsList.value = channels.filter(channel => channel.is_pinned);
    privateChannelsList.value = channels.filter(channel => channel.visibility === 'private' && !channel.is_invited && !channel.is_pinned && !channel.is_banned);
    publicChannelsList.value = channels.filter(channel => channel.visibility === 'public' && !channel.is_invited && !channel.is_pinned && !channel.is_banned);
  } catch (error) {
    if (error.response && error.response.status === 401) {
      console.error('Unauthorized: Please log in again.');
    } else {
      console.error('Failed to load channels:', error);
    }
  }
}

provide('loadChannels', loadChannels)
provide('deleteChannel', deleteChannel)
provide('joinOrCreateChannel', joinOrCreateChannel)
provide('leaveChannel', leaveChannel)
provide('inviteToChannel', inviteToChannel)
provide('revokeUser', revokeUser)
provide('kickUser', kickUser)


onMounted(() => {
  loadChannels();
});
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