<template>
    <div class="q-pa-md row items-center justify-between">
        <div class="row items-center">
            <q-avatar size="42px" class="bg-grey-3 text-teal-7">
                <q-icon name="person" size="28px" />
            </q-avatar>
            <div class="q-ml-md column">
               <div class="text-subtitle2">{ nickname }</div>
               <div class="text-caption text-grey-6 row items-center">
                 <q-icon name="circle" size="10px" class="q-mr-xs" :color="dndEnabled ? 'grey-5' : 'teal-5'" />
                 {{ dndEnabled ? 'DnD' : 'Online' }}
               </div>
            </div>
        </div>
        <div class="row items-center">
            <q-btn icon="settings" flat round color="teal-7" size="md" aria-label="User Preferences" class="q-mr-xs" @click="openSettings">
            </q-btn>
            <q-btn icon="logout" flat round color="teal-7" size="md" aria-label="Logout" @click="logout">
            </q-btn>
        </div>
    </div>
    <q-separator />

    <SettingsPopupModal ref="settingsModal" @dnd-changed="dndEnabled = $event" />
</template>

<script setup>
import { ref } from "vue";
import SettingsPopupModal from "src/components/SettingsPopupModal.vue";
import { useRouter } from 'vue-router'

const router = useRouter()

const settingsModal = ref(null);
const dndEnabled = ref(localStorage.getItem('dndEnabled') === '1')

function openSettings() {
  settingsModal.value.open();
}

function logout(){

    router.push('/login')
}

</script>