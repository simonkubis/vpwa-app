<template>
    <q-page class="flex column q-pa-md" style="height: calc(100vh - 50px);">

        <!-- Channel bar -->
        <channel-bar ref="channelBarRef" :channel-name="channelName" />

        <!-- Conversation window -->
        <div
            ref="messagesContainer"
            class="messages-container q-pa-md q-mt-md rounded-borders"
            style="background-color: #393939;"
            @scroll="onScroll"
        >
            <div v-for="(msg, idx) in messages" :key="msg.id || idx" class="q-mb-sm">
                <div :class="[
                    'q-pa-sm rounded-borders inline-block',
                    msg.sender === 'me'
                        ? 'bg-teal-5 text-white self-end'
                        : 'bg-custom self-start',
                    msg.content.includes('@user') ? 'border border-yellow-5' : '',
                    msg.sender === 'me' ? 'float-right' : 'float-left'
                ]" style="max-width: 70%; min-width: 150px;">
                    <div class="text-caption text-grey-7" v-if="msg.sender !== 'me'">{{ msg.sender }}</div>
                    <div>{{ msg.content }}</div>
                    <div class="text-left text-caption text-grey-5">{{ msg.time }}</div>
                </div>
            </div>
        </div>

        <div  v-if="membership === 'invited'" class="q-mt-md">
            <q-card flat bordered class="row items-center justify-between q-px-md q-py-sm bg-custom rounded-borders">
                <div>You are viewing <b>#{{ channelName }}</b></div>
                <div class="col-auto">
                <q-btn color="teal-6" unelevated label="Join Channel" class="q-mr-sm" @click="$emit('join')" />
                <q-btn flat label="See More Details" @click="$emit('see-details')" />
                </div>
            </q-card>
        </div>
        <!-- Message input -->
        <div v-else>
            <div v-if="showTyping" class="text-caption text-grey-5 q-mb-none">
                <span
                    class="text-teal-4 cursor-pointer"
                    title="Show draft"
                    @mouseenter="hoverOpen"
                    @mouseleave="hoverScheduleClose"
                >
                    <span>{{ typingName }}</span>

                    <q-popup-proxy
                    v-model="typingMenuOpen"
                    anchor="top left"
                    self="bottom left"
                    :offset="[0, 0]"
                    transition-show="jump-down"
                    transition-hide="jump-up"
                    >
                    <q-card
                        flat
                        bordered
                        class="bg-custom q-pa-sm"
                        style="max-width: 360px"
                        @mouseenter.stop="hoverCancel"
                        @mouseleave="hoverScheduleClose"
                    >
                        <div class="text-caption text-grey-4 q-mb-xs">Draft from {{ typingName }}</div>
                        <div class="text-body2">{{ typingPreview }}</div>
                    </q-card>
                    </q-popup-proxy>
                </span>
                <span> is typing…</span>
            </div>
            <div class="q-mt-none">
                <div ref="inputAnchor">
                <q-input
                    ref="inputRef"
                    v-model="newMessage"
                    placeholder="Type a message..."
                    filled
                    color="teal-6"
                    dark
                    @keyup.enter="sendMessage"
                    @update:model-value="onInputChange"
                >
                    <template #append>
                    <q-btn flat icon="send" @click="sendMessage" />
                    </template>
                </q-input>
                </div>

                <!-- slash command menu -->
                <q-menu
                    ref="slashMenuRef"
                    v-model="slashMenuOpen"
                    :target="inputAnchor"
                    anchor="bottom left"
                    self="top left"
                    :offset="[0, 8]"
                    no-focus
                    class="menu-525"
                    :content-style="{ width: 'min(560px, 96vw)', borderRadius: '10px', overflow: 'hidden' }"
                    >
                    <q-list separator>
                        <q-item
                        v-for="cmd in filteredCommands"
                        :key="cmd.name"
                        class="q-pa-sm no-hover"
                        >
                            <q-item-section avatar>
                                <q-icon :name="cmd.icon || 'terminal'" />
                            </q-item-section>
                            <q-item-section>
                                <q-item-label class="text-white">/{{ cmd.name }}</q-item-label>
                                <q-item-label caption class="text-grey-4">{{ cmd.description }}</q-item-label>
                            </q-item-section>
                        </q-item>

                        <q-item v-if="newMessage.trim().startsWith('/') && filteredCommands.length === 0">
                        <q-item-section>
                            <q-item-label class="text-grey-4">No matching commands</q-item-label>
                        </q-item-section>
                        </q-item>
                    </q-list>
                </q-menu>
            </div>
        </div>
    </q-page>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import ChannelBar from 'src/components/ChannelBar.vue'

const slashCommands = [
    {
        name: 'list',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    },
    {
    name: 'join',
    description: 'Join a channel: /join <channelName>',
    type: 'channel',
    run: ([channel]) => {
        console.log('joining channel:', channel)
    },
    },
    {
        name: 'list1',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    }, 
    {
        name: 'list12',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    }, 
    {
        name: 'list123',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    }, 
    {
        name: 'list1234',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    }

]
const allMessages = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    sender: i % 2 === 0 ? 'me' : 'Alice',
    content: `Message #${i + 1}`,
    time: `09:${(i + 1).toString().padStart(2, '0')}`
}))
allMessages.push({
    id: 51,
    sender: 'Bob',
    content: `Hello everyone! Especially @user`,
    time: `10:00`
})

defineProps({
  channelName: { type: String, required: true },
  membership: { type: String, required: true },
  typingName: { type: String, default: 'Marek' },
  showTyping: { type: Boolean, default: true },
  typingPreview: {
    type: String,
    default:
      'cauko som sprava a som extremne ze rozpisana hej a tak teraz si tu tak pisem v podstate do vetra a neviem no akoze uz asi aj dopisem za chvilu'
  }
})

const channelBarRef = ref(null) 
const inputRef = ref(null) 
const inputAnchor = ref(null)


const messages = ref([])
const messagesContainer = ref(null)


const pageSize = 10
let currentIndex = allMessages.length 
let loading = false


const slashMenuRef = ref(null)
const slashMenuOpen = ref(false)
const newMessage = ref('')

const filteredCommands = computed(() => {
  const t = newMessage.value.trim()
  if (!t.startsWith('/')) return []
  const q = t.slice(1).split(/\s+/)[0].toLowerCase()
  return q
    ? slashCommands.filter(c => c.name.toLowerCase().startsWith(q))
    : slashCommands
})



function onInputChange (val) {
  const starts = val.trim().startsWith('/')
  if (starts !== slashMenuOpen.value) {
    slashMenuOpen.value = starts
  }
}

watch([filteredCommands, slashMenuOpen], () => {
  nextTick(() => {
    slashMenuRef.value?.updatePosition?.()
  })
})

function closeSlashMenu () {
  slashMenuOpen.value = false
}

function parseArgsFromInput () {
  const parts = newMessage.value.trim().split(/\s+/)
  return parts.slice(1)
}

function runSlashCommand (cmd) {
  try {
    const args = parseArgsFromInput()
    cmd?.run?.(args)
  } finally {
    newMessage.value = ''
    closeSlashMenu()
  }
}

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



//is typing
const typingMenuOpen = ref(false)
let hoverTimer

function hoverOpen () {
  if (slashMenuOpen.value) slashMenuOpen.value = false
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => { typingMenuOpen.value = true }, 60)
}
function hoverScheduleClose () {
  clearTimeout(hoverTimer)
  hoverTimer = setTimeout(() => { typingMenuOpen.value = false }, 120)
}
function hoverCancel () {
  clearTimeout(hoverTimer)
}



function sendMessage() {
    const text = newMessage.value.trim()
    if (!text) return

    if (text.startsWith('/')) {
        const name = text.slice(1).split(/\s+/)[0].toLowerCase()
        const cmd = slashCommands.find(c => c.name.toLowerCase() === name)
        if (cmd) {
        runSlashCommand(cmd)
        } else {
        alert(`Unknown command: /${name}`)
        newMessage.value = ''
        closeSlashMenu()
        }
        return
    }

    const now = new Date()    
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    messages.value.push({ id: Date.now(), sender: 'me', content: text, time })

    newMessage.value = ''
    nextTick(() => {
        if (messagesContainer.value) {
            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
        }
    })
}

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
.bg-custom {
  background-color: #525252;
  color: #fff;
}
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

.border-yellow-5 {
  border: 2px solid teal;
}

.no-hover:hover,
.no-hover:focus {      /* pri focuse na slash menu vypnut hover efekt nech sa nezda ze sa da na to kliknut */
  background: transparent;
  cursor: default;
}

</style>