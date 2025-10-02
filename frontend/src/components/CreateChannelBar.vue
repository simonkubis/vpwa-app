<template>
    <q-card class="full-width no-shadow">
        <q-card-section>
            <div class="text-subtitle2 q-mb-md">Create Channel</div>
            <q-form @submit.prevent="createChannel">
                <q-input filled v-model="channelName" label="Channel Name" class="q-mb-md" color="teal-7" dense
                    required />
                <q-input filled v-model="invitedUsersText" label="Invite users (@username, comma separated)"
                    color="teal-7" dense class="q-mb-md" @blur="parseInvitedUsers" />
                <q-btn label="Create" color="teal-7" type="submit" class="full-width" unelevated />
            </q-form>
        </q-card-section>
    </q-card>
    <q-separator />
</template>


<script setup>
import { ref } from 'vue'

const channelName = ref('')
// const invitedUsersText = ref('')



function createChannel() {

    
}
</script>