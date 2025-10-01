<template>
    <q-page class="flex column q-pa-md" style="height: calc(100vh - 50px);">
       
        <!-- Channel bar -->
        <channel-bar />

        <!-- Conversation window -->
        <div
            ref="messagesContainer"
            class="messages-container q-pa-md q-mt-md  bg-teal-1 rounded-borders"
        >
            <div v-for="(msg, idx) in messages" :key="idx" class="q-mb-sm">
                <div
                    :class="[
                        'q-pa-sm',
                        'rounded-borders',
                        'inline-block',
                        msg.sender === 'me' ? 'bg-teal-5 text-white self-end' : 'bg-white text-black self-start',
                        msg.sender === 'me' ?  'float-right': 'float-left'
                    ]"
                    style="max-width: 70%; min-width: 150px;"
                >
                    <div class="text-caption text-grey-7" v-if="msg.sender !== 'me'">{{ msg.sender }}</div>
                    <div>{{ msg.content }}</div>
                    <div class="text-left text-caption text-grey-5">{{ msg.time }}</div>
                </div>
            </div>
        </div>

        <!-- Message input -->
        <div class="bg-white q-mt-md">
            <q-input
                v-model="newMessage"
                placeholder="Type a message..."
                filled
                color="teal-7"
                @keyup.enter="sendMessage"
            >
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

// toto je len priklad
// TODO
// 1. infinite scroll (treba BE)
// 2. notifikacie

const messages = ref([
    { sender: 'me', content: 'Hey there!', time: '09:00' },
    { sender: 'Alice', content: 'Hi! How are you?', time: '09:01' },
    { sender: 'me', content: 'I am good, thanks! And you?', time: '09:02' },
    { sender: 'Bob', content: 'Hello everyone!', time: '09:03' },
    { sender: 'Alice', content: 'Doing well!', time: '09:04' },
    { sender: 'me', content: 'What are you up to?', time: '09:05' },
    { sender: 'Bob', content: 'Just working on a project.', time: '09:06' },
    { sender: 'Alice', content: 'Same here.', time: '09:07' },
    { sender: 'me', content: 'Let me know if you need help.', time: '09:08' },
    { sender: 'Bob', content: 'Thanks!', time: '09:09' },
    { sender: 'Alice', content: 'Appreciate it!', time: '09:10' },
    { sender: 'me', content: 'No problem.', time: '09:11' },
    { sender: 'Bob', content: 'Anyone up for coffee later?', time: '09:12' },
    { sender: 'Alice', content: 'I am!', time: '09:13' },
    { sender: 'me', content: 'Count me in.', time: '09:14' },
    { sender: 'Bob', content: 'Great, let\'s meet at 11.', time: '09:15' },
    { sender: 'Alice', content: 'See you then!', time: '09:16' },
    { sender: 'me', content: 'See you!', time: '09:17' },
    { sender: 'Bob', content: 'Bye!', time: '09:18' },
    { sender: 'Alice', content: 'Bye!', time: '09:19' },
    { sender: 'me', content: 'Back to work now.', time: '09:20' },
    { sender: 'Bob', content: 'Same here.', time: '09:21' },
    { sender: 'Alice', content: 'Let\'s do our best!', time: '09:22' }
])

const newMessage = ref('')
const messagesContainer = ref(null)

function sendMessage() {
    if (newMessage.value.trim() !== '') {
        const now = new Date()
        const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        messages.value.push({
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
}

onMounted(() => {
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

</style>