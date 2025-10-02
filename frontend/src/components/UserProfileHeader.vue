<template>
    <div class="q-pa-md row items-center justify-between">
        <div class="row items-center">
            <q-avatar size="42px" class="bg-grey-3 text-teal-7">
                <q-icon name="person" size="28px" />
            </q-avatar>
            <div class="text-subtitle2 q-ml-md">{username}</div>
        </div>
        <div class="row items-center">
            <q-btn icon="settings" flat round color="teal-7" size="md" aria-label="User Preferences" class="q-mr-xs" @click="openSettings">
            </q-btn>
            <q-btn icon="logout" flat round color="teal-7" size="md" aria-label="Logout" @click="logout">
            </q-btn>
        </div>
    </div>
    <q-separator />

    <SettingsPopupModal ref="settingsModal" />
</template>

<script setup>
import { ref } from "vue";
import SettingsPopupModal from "src/components/SettingsPopupModal.vue";
import { useRouter } from 'vue-router'

const router = useRouter()

const settingsModal = ref(null);

function openSettings() {
  settingsModal.value.open();
}

function logout(){

    router.push('/login')
}

</script>