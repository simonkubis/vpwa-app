<template>
    <q-page class="flex column q-pa-md" style="height: calc(100vh - 50px);">

        <!-- Channel bar -->
        <channel-bar />

        <!-- Conversation window -->
        <div
            ref="messagesContainer"
            class="messages-container q-pa-md q-mt-md bg-teal-1 rounded-borders"
            @scroll="onScroll"
        >
            <div v-for="(msg, idx) in messages" :key="msg.id || idx" class="q-mb-sm">
                <div :class="[
                    'q-pa-sm rounded-borders inline-block',
                    msg.sender === 'me'
                        ? 'bg-teal-5 text-white self-end'
                        : 'bg-white text-black self-start',
                    msg.sender === 'me' ? 'float-right' : 'float-left'
                ]" style="max-width: 70%; min-width: 150px;">
                    <div class="text-caption text-grey-7" v-if="msg.sender !== 'me'">{{ msg.sender }}</div>
                    <div>{{ msg.content }}</div>
                    <div class="text-left text-caption text-grey-5">{{ msg.time }}</div>
                </div>
            </div>
        </div>

        <!-- Message input -->
        <div class="bg-white q-mt-md">
            <q-input v-model="newMessage" placeholder="Type a message..." filled color="teal-7"
                @keyup.enter="sendMessage">
                <template v-slot:append>
                    <q-btn flat icon="send" @click="sendMessage" />
                </template>
            </q-input>
        </div>
    </q-page>
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue'
import ChannelBar from 'src/components/ChannelBar.vue'

const allMessages = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    sender: i % 2 === 0 ? 'me' : 'Alice',
    content: `Message #${i + 1}`,
    time: `09:${(i + 1).toString().padStart(2, '0')}`
}))

const messages = ref([])
const messagesContainer = ref(null)
const pageSize = 10
let currentIndex = allMessages.length 
let loading = false

function loadOlderMessages() {
    if (loading || currentIndex <= 0) return
    loading = true

    const container = messagesContainer.value
    const oldScrollHeight = container ? container.scrollHeight : 0

    const start = Math.max(currentIndex - pageSize, 0)
    const newMessages = allMessages.slice(start, currentIndex)
    messages.value = [...newMessages, ...messages.value]
    currentIndex = start

    nextTick(() => {
        if (container) {
            if (currentIndex === 0) {
                container.scrollTop = 0
            } else {
                container.scrollTop = container.scrollHeight - oldScrollHeight
            }
        }
        loading = false
    })
}

function onScroll() {
    const container = messagesContainer.value
    if (!container) return
    if (container.scrollTop <= 50) {
        loadOlderMessages()
    }
}

function sendMessage() {
    if (!newMessage.value.trim()) return
    const now = new Date()
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    messages.value.push({
        id: Date.now(),
        sender: 'me',
        content: newMessage.value,
        time
    })
    newMessage.value = ''
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

const newMessage = ref('')

onMounted(() => {
    loadOlderMessages()
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
})
</script>

<style scoped>
.messages-container {
    flex: 1 1 auto;
    min-height: 0;
    height: 1px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
}
.self-end {
    align-self: flex-end;
}
.self-start {
    align-self: flex-start;
}
</style>