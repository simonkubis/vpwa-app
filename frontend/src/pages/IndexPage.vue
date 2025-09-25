<template>
  <q-page class="flex flex-center">
    <div>
      <q-btn label="Get hello from backend" color="primary" @click="getHello" />
      <div v-if="helloMessage" class="q-mt-md text-h6">
        {{ helloMessage }}
      </div>
    </div>
  </q-page>
</template>

<script setup>
import { ref } from 'vue'
import axios from 'axios'

const helloMessage = ref('')

const api = import.meta.env.API_URL || 'http://localhost:3333'

const getHello = async () => {
  try {
    const res = await axios.get(`${api}/hello`)
    helloMessage.value = res.data.message
  } catch (err) {
    helloMessage.value = 'Error connecting to API'
    console.error(err)
  }
}
</script>
