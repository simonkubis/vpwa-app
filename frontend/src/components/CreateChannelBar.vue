<template>
  <q-card class="full-width no-shadow" style="background-color: #393939;">
    <q-card-section>
      <div class="text-subtitle2 q-mb-md">Create Channel</div>
      <q-form @submit.prevent="createChannel">
        <q-input filled v-model="channelName" label="Channel Name" class="q-mb-md" color="teal-7" dense required dark />
        <q-select v-model="channelVisibility" :options="visibilityOptions" class="q-mb-md"
          color="teal-7" dense required dark emit-value map-options />
        <q-input filled v-model="invitedUsersText" label="Invite users (@username, comma separated)" color="teal-7"
          dense class="q-mb-md" @blur="parseInvitedUsers" dark />
        <q-btn label="Create" color="teal-7" type="submit" class="full-width" unelevated />
      </q-form>
    </q-card-section>
  </q-card>
  <q-separator />
</template>


<script setup>
import { ref } from 'vue'
import axios from 'axios'

const emit = defineEmits(['channelCreated'])

const channelName = ref('')
const channelVisibility = ref('public')
const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Private', value: 'private' },
]

const invitedUsersText = ref('')
const API_URL = import.meta.env.VITE_API_URL

function parseInvitedUsers() {

  invitedUsersText.value = invitedUsersText.value.replaceAll('@', '');

  return invitedUsersText.value
    .split(',')
    .map((user) => user.trim())
    .filter((user) => user.length > 0)
}

async function createChannel() {
  try {
    const users = parseInvitedUsers()

    const visibilityValue = channelVisibility.value.value 
        ? channelVisibility.value.value 
        : channelVisibility.value; 

    const response = await axios.post(
      `${API_URL}/channels`,
      {
        name: channelName.value,
        visibility: visibilityValue,
        description: '',
        users, // Include users array in the request
      },
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
        },
      }
    )

    emit('channelCreated')

    const channel = response.data.data

    console.log('Channel created successfully:', channel)
    // Optionally reset form fields
    channelName.value = ''
    invitedUsersText.value = ''
    channelVisibility.value = 'public'
  } catch (error) {
    console.error('Failed to create channel:', error)
  }
}
</script>