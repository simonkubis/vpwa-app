<template>
    <q-page class="flex column q-pa-md" style="height: calc(100vh - 50px);">

        <channel-bar v-if="!isOffline && isChannelRoute" ref="channelBarRef" :key="channelId"
            :channel-meta="channelMeta" :membership="membership" :members="members" />

        <q-banner v-if="isOffline" class="bg-grey-8 text-white q-mb-md q-mt-md" rounded>
            <template v-slot:avatar>
                <q-icon name="wifi_off" color="grey-4" />
            </template>
            You are currently offline. Messages cannot be sent or received.
        </q-banner>

        <div ref="messagesContainer" class="messages-container q-pa-md q-mt-md rounded-borders"
            style="background-color: #393939;" @scroll="onScroll">

            <div v-if="loading && hasMoreMessages" class="text-center q-py-md">
                <q-spinner-dots color="teal-5" size="40px" />
                <div class="text-caption text-grey-5 q-mt-xs">Loading older messages...</div>
            </div>

            <div v-for="(msg, idx) in messages" :key="msg.id || idx"
                :class="['message-row', 'q-mb-sm', msg.userId == currentUser.id ? 'message-row-right' : 'message-row-left']">
                <div :class="[
                    'q-pa-sm rounded-borders',
                    msg.userId == currentUser.id
                        ? 'bg-teal-5 text-white'
                        : 'bg-custom',
                    msg.body.includes(`@${currentUser.nickname}`) ? 'bg-highlight' : ''
                ]" style="max-width: 70%; min-width: 150px;">
                    <div class="text-caption text-grey-6" v-if="msg.userId != currentUser.id">
                        {{ new Date(msg.createdAt).toLocaleString([], {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit'
                        }) }}
                        —
                        @{{ msg.user_nickname }}
                    </div>
                    <div class="text-caption text-grey-5" v-else>
                        {{ new Date(msg.createdAt).toLocaleString([], {
                            hour12: false,
                            hour: '2-digit',
                            minute: '2-digit'
                        }) }}
                    </div>
                    <div class="q-mt-xs" v-html="highlightMentions(msg.body)"></div>
                    <div class="text-left text-caption text-grey-6">

                    </div>
                </div>
            </div>
        </div>

        <div v-if="membership === 'invited'" class="q-mt-md">
            <q-card flat bordered class="row items-center justify-between q-px-md q-py-sm bg-custom rounded-borders">
                <div>You are viewing <b>#{{ channelName }}</b></div>
                <div class="col-auto">
                    <q-btn color="teal-6" unelevated label="Join Channel" class="q-mr-sm" @click="$emit('join')" />
                    <q-btn flat label="See More Details" @click="$emit('see-details')" />
                </div>
            </q-card>
        </div>
        <div v-else>
            <div v-if="showTyping" class="text-caption text-grey-5 q-mb-none">
                <span class="text-teal-4 cursor-pointer" title="Show draft" @mouseenter="hoverOpen"
                    @mouseleave="hoverScheduleClose">
                    <span>{{ typingName }}</span>

                    <q-popup-proxy v-model="typingMenuOpen" anchor="top left" self="bottom left" :offset="[0, 0]"
                        transition-show="jump-down" transition-hide="jump-up">
                        <q-card flat bordered class="bg-custom q-pa-sm" style="max-width: 360px"
                            @mouseenter.stop="hoverCancel" @mouseleave="hoverScheduleClose">
                            <div class="text-caption text-grey-4 q-mb-xs">Draft from {{ typingName }}</div>
                            <div class="text-body2">{{ typingPreview }}</div>
                        </q-card>
                    </q-popup-proxy>
                </span>
                <span> is typing…</span>
            </div>
            <div class="q-mt-none">
                <div ref="inputAnchor">
                    <q-input ref="inputRef" v-model="newMessage" placeholder="Type a message..." filled color="teal-6"
                        dark @keyup.enter="sendMessage" @update:model-value="onInputChange">
                        <template #append>
                            <q-btn flat icon="send" :disable="isOffline" @click="sendMessage" />
                        </template>
                    </q-input>
                </div>

                <q-menu ref="slashMenuRef" v-model="slashMenuOpen" :target="inputAnchor" anchor="bottom left"
                    self="top left" :offset="[0, 8]" no-focus class="menu-525"
                    :content-style="{ width: 'min(560px, 96vw)', borderRadius: '10px', overflow: 'hidden' }">
                    <q-list separator>
                        <q-item v-for="cmd in filteredCommands" :key="cmd.name" class="q-pa-sm no-hover">
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
import { ref, computed, watch, onMounted, nextTick, inject } from 'vue'
import ChannelBar from 'src/components/ChannelBar.vue'
import axios from 'axios'
import { useRoute, useRouter } from 'vue-router'
import { useQuasar } from 'quasar'
import { useTransmit } from 'src/transmit'

const { transmit } = useTransmit()

const joinOrCreateChannel = inject('joinOrCreateChannel')
const deleteChannel = inject('deleteChannel')
const leaveChannel = inject('leaveChannel')
const inviteToChannel = inject('inviteToChannel')
const revokeUser = inject('revokeUser')
const kickUser = inject('kickUser')

const $q = useQuasar()

const route = useRoute()
const router = useRouter()

const notificationPermission = ref(Notification.permission)

const userStatus = ref('online') 
const isOffline = computed(() => userStatus.value === 'offline')
const isChannelRoute = computed(() =>
    route.path.startsWith('/channel/')
)



async function loadInitialSettings() {
    try {
        const res = await axios.get(`${API_URL}/settings`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
            }
        })
        userStatus.value = res.data.status
    } catch (err) {
        console.error("Failed to load settings", err)
        userStatus.value = "online"   
    }
}

setInterval(loadInitialSettings, 500)


async function fetchSettings() {
    try {
        const res = await axios.get(`${API_URL}/settings`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
            }
        })
        console.log('Fetched settings:', res.data)
        return res.data
    } catch (err) {
        console.error('Failed to fetch settings:', err)
        throw err
    }
}


async function requestNotificationPermission() {
    if ('Notification' in window) {
        const permission = await Notification.requestPermission()
        notificationPermission.value = permission

        if (permission === 'granted') {
            $q.notify({
                message: 'Notifications enabled!',
                color: 'positive',
                icon: 'check'
            })
        }
    }
}

function isMentioned(messageBody) {
    if (!messageBody) return false

    const nickname = currentUser.nickname
    const lowerBody = messageBody.toLowerCase()
    console.log("isMentioned: " + lowerBody.includes(`@${nickname.toLowerCase()}`))
    return lowerBody.includes(`@${nickname.toLowerCase()}`)
}

async function showBrowserNotification(payload) {
    try {
        const settings = await fetchSettings()

        console.log(settings.notifPref, settings.status)
        console.log('Checking notification conditions...')

        if (settings.notifPref === 'none' || settings.status === 'dnd' || settings.status === 'offline') {
            console.log('Notifications disabled in settings')
            return
        }

        if (settings.notifPref == 'mentions_only' && !isMentioned(payload.message.body)) {
            console.log('Skipping notification - not mentioned')
            return
        }

        if ($q.appVisible) {
            console.log('App is visible, skipping notification')
            return
        }

        if (!('Notification' in window)) {
            console.log('Browser does not support notifications')
            return
        }

        if (Notification.permission !== 'granted') {
            console.log('Notification permission not granted')
            return
        }

        const title = `${payload.message.user_nickname || 'Someone'} in #${payload.channelName}`

        const maxLength = 100
        const body = payload.message.body.length > maxLength
            ? payload.message.body.substring(0, maxLength) + '...'
            : payload.message.body

        const notification = new Notification(title, {
            body,
            icon: '/favicon.ico', 
            tag: `channel-${payload.channelId}`, 
            requireInteraction: false,
            silent: false
        })

        notification.onclick = () => {
            window.focus()
            router.push({
                name: 'channel',
                params: { id: payload.channelId },
                query: { name: payload.channelName }
            })
            notification.close()
        }

        setTimeout(() => notification.close(), 5000)

    } catch (err) {
        console.error('Failed to fetch settings:', err)
    }
}

const channelId = computed(() => Number(route.params.id))
const channelName = computed(() => {
    return channelMeta.value?.name || route.query.name || 'a channel'
})

function highlightMentions(messageBody) {
    const currentUserNickname = currentUser.nickname
    const mentionPattern = new RegExp(`@${currentUserNickname}`, 'g')
    return messageBody.replace(mentionPattern, `<span class="bg-teal-10">@${currentUserNickname}</span>`)
}

console.log('Channel ID from route:', channelId.value)
console.log(typeof (channelId.value))

const channelMeta = ref({})
const membership = ref({})
const members = ref([])

const slashCommands = [
    {
        name: 'list',
        description: 'Show members of the current channel',
        icon: 'group',
        run: () => channelBarRef.value?.openMembersList?.()
    },
    {
        name: 'join',
        description: 'Join a public channel/channel you\'re invited to, or create a new channel if it does not exist. Usage: /join channelName [public|private]',
        icon: 'add_circle',
        run: (args) => {
            if (!args || args.length === 0) {
                $q.notify({
                    message: 'Please provide a channel name. Usage: /join channelName [public|private]',
                    color: 'warning',
                    icon: 'warning'
                })
                return
            }

            const channelName = args[0]
            const visibility = args[1]?.toLowerCase().replaceAll('[', '').replaceAll(']', '') // optional: 'public' or 'private'

            if (visibility && !['public', 'private'].includes(visibility)) {
                $q.notify({
                    message: 'Visibility must be either "public" or "private"',
                    color: 'warning',
                    icon: 'warning'
                })
                return
            }

            joinOrCreateChannel(channelName, visibility)
        }
    },
    {
        name: 'quit',
        description: 'Delete the current channel (admin only).',
        icon: 'group',
        run: async () => {
            await deleteChannel(channelMeta.value); 
            checkChannelExists(); 
            resetMessages();
        }
    },
    {
        name: 'cancel',
        description: 'Leave the channel (if admin then channel dies)',
        icon: 'group',
        run: () => leaveChannel(channelMeta.value)
    },
   {
        name: 'invite',
        description: 'Invite users to the current channel. Usage: /invite nickname',
        icon: 'group',
        run: (args) => {
            if (!args || args.length === 0) {
                $q.notify({
                    message: 'Please provide a user nickname. Usage: /invite nickname',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            if (!channelMeta.value || !channelMeta.value.id) {
                $q.notify({
                    message: 'No active channel selected to invite users to.',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            const nickname = args[0];
            const currentChannelId = channelMeta.value.id;

            inviteToChannel(currentChannelId, nickname)
            .then((data) => {
                const message = data?.message || "success"
                $q.notify({
                message,
                color: 'positive',
                icon: 'check',
                })
            })
            .catch((error) => {
                const backendError =
                error?.response?.data?.error || error?.response?.data?.message

                const message = backendError || `Failed to invite user "${nickname}"`;

                $q.notify({
                message,
                color: 'negative',
                icon: 'error',
                })
            })
        }
    },

    {
        name: 'kick',
        description: 'vote to kick user (3 votes required). If admin, user is kicked immediately. Usage: /kick nickname',
        icon: 'group',
         run: (args) => {
            if (!args || args.length === 0) {
                $q.notify({
                    message: 'Please provide a user nickname. Usage: /kick nickname',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            if (!channelMeta.value || !channelMeta.value.id) {
                $q.notify({
                    message: 'No active channel selected to kick user.',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            const nickname = args[0];

            kickUser(channelMeta.value, nickname)
                .then((data) => {
                    const message = data?.message || "success"
                    $q.notify({
                    message,
                    color: data?.banned ? 'positive' : 'info',
                    icon: data?.banned ? 'check' : 'how_to_vote',
                    })
                })
                .catch((error) => {
                    const backendError =
                    error?.response?.data?.error || error?.response?.data?.message

                    const message = backendError || `Failed to kick user "${nickname}"`;

                    $q.notify({
                    message,
                    color: 'negative',
                    icon: 'error',
                    })
                })
        }
    },
    {
        name: 'revoke',
        description: 'Kick user from private channel (admin only). Usage: /revoke nickname',
        icon: 'group',
        run: (args) => {
            if (!args || args.length === 0) {
                $q.notify({
                    message: 'Please provide a user nickname. Usage: /revoke nickname',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            if (!channelMeta.value || !channelMeta.value.id) {
                $q.notify({
                    message: 'No active channel selected to revoke user.',
                    color: 'warning',
                    icon: 'warning',
                });
                return;
            }

            const nickname = args[0];

            revokeUser(channelMeta.value, nickname)
                .then((data) => {
                    $q.notify({
                        message: `User "${nickname}" has been revoked successfully!`,
                        color: 'positive',
                        icon: 'check',
                    });
                    console.log(data)
                })
                .catch((error) => {
                    const backendError = error?.response?.data?.error
                    const message =
                    backendError || `Failed to revoke user "${nickname}"`

                    $q.notify({
                    message,
                    color: 'negative',
                    icon: 'error',
                    })
                });
        }
    }
]



const channelBarRef = ref(null)
const inputRef = ref(null)
const inputAnchor = ref(null)

const messages = ref([])
const messagesContainer = ref(null)
const channelExists = ref(true)

const typingUsers = ref(new Map()) 
const typingDebounceTime = 5000 
const sendTypingThrottle = 100 
let lastTypingSent = 0
let typingTimeoutId = null

const pageSize = 20
let currentPage = 1
let loading = false
let isScrollingProgrammatically = false

const API_URL = import.meta.env.VITE_API_URL
const currentUser = JSON.parse(localStorage.getItem('auth.user'))

const activeTypingUser = computed(() => {
    const now = Date.now()
    const active = Array.from(typingUsers.value.entries())
        .filter(([userId, data]) => {
            return userId !== currentUser.id &&
                (now - data.timestamp) < typingDebounceTime
        })

    if (active.length === 0) return null

    const [userId, data] = active[0]
    return {
        userId,
        nickname: data.nickname,
        text: data.text || ''
    }
})

const showTyping = computed(() => activeTypingUser.value !== null)
const typingName = computed(() => activeTypingUser.value?.nickname || '')
const typingPreview = computed(() => activeTypingUser.value?.text || '')

setInterval(() => {
    const now = Date.now()
    typingUsers.value.forEach((data, userId) => {
        if (now - data.timestamp > typingDebounceTime) {
            typingUsers.value.delete(userId)
        }
    })
}, 500)

async function sendTypingIndicator() {
    if (isOffline.value) return

    const now = Date.now()

    if (now - lastTypingSent < sendTypingThrottle) {
        return
    }

    lastTypingSent = now

    try {
        await axios.post(
            `${API_URL}/typing`,
            {
                channelId: channelId.value,
                text: newMessage.value.substring(0, 200) 
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth.token')}`
                }
            }
        )
    } catch (err) {
        console.error('Failed to send typing indicator:', err)
    }
}

function stopTypingIndicator() {
    clearTimeout(typingTimeoutId)
    typingTimeoutId = setTimeout(async () => {
        if (isOffline.value) return

        try {
            await axios.post(
                `${API_URL}/typing`,
                {
                    channelId: channelId.value,
                    text: '' 
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('auth.token')}`
                    }
                }
            )
        } catch (err) {
            console.error('Failed to send stop typing:', err)
        }
    }, typingDebounceTime)
}

function onInputChange(val) {
    const starts = val.trim().startsWith('/')
    if (starts !== slashMenuOpen.value) {
        slashMenuOpen.value = starts
    }

    if (val.trim().length > 0 && !isOffline.value) {
        sendTypingIndicator()
        stopTypingIndicator()
    }
}

async function checkChannelExists() {
    if (!channelId.value) {
        console.log('[DEBUG] No channel_id, redirecting to /')
        router.replace('/')
        return
    }

    try {
        console.log('[DEBUG] Checking channel existence for ID:', channelId.value)
        const res = await axios.get(`${API_URL}/channels/${channelId.value}/exists`, {
            headers: { Authorization: `Bearer ${localStorage.getItem('auth.token')}` }
        })
        if (!res.data?.exists) {
            console.log('[DEBUG] Channel does not exist, redirecting to /')
            router.replace('/')
        } else {
            channelExists.value = true
            console.log('[DEBUG] Channel exists, continue rendering')
        }
    } catch (err) {
        console.error('[DEBUG] Failed to check channel existence, redirecting to /', err)
        router.replace('/')
    }
}

const hasMoreMessages = ref(true) 

async function fetchMessages() {
    if (isOffline.value || isChannelRoute.value === false) {
        console.log('Skipping message fetch - user is offline')
        return
    }

    await checkChannelExists()

    console.log('Fetching messages for channel ID:', channelId.value)

    try {
        const response = await axios.get(`${API_URL}/channels/${channelId.value}/messages`, {
            params: {
                page: currentPage,
                limit: pageSize,
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
            },
        })

        const fetchedMessages = response.data.data.data
        console.log('Fetched messages from backend:', fetchedMessages)

        if (Array.isArray(fetchedMessages)) {
            if (fetchedMessages.length < pageSize) {
                hasMoreMessages.value = false
            }

            const normalized = [...fetchedMessages].reverse()

            messages.value = [...normalized, ...messages.value]
            currentPage++
        }
    } catch (err) {
        console.error('Failed to fetch messages:', err)
    }
}

function loadOlderMessages() {
    if (loading || isOffline.value || !hasMoreMessages.value) return

    loading = true

    const container = messagesContainer.value
    const oldScrollHeight = container ? container.scrollHeight : 0

    fetchMessages().then(() => {
        nextTick(() => {
            if (container) {
                isScrollingProgrammatically = true
                container.scrollTop = container.scrollHeight - oldScrollHeight
                setTimeout(() => { isScrollingProgrammatically = false }, 100)
            }
            loading = false
        })
    }).catch(() => {
        loading = false
    })
}

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



watch([filteredCommands, slashMenuOpen], () => {
    nextTick(() => {
        slashMenuRef.value?.updatePosition?.()
    })
})

function closeSlashMenu() {
    slashMenuOpen.value = false
}

function parseArgsFromInput() {
    const parts = newMessage.value.trim().split(/\s+/)
    return parts.slice(1)
}

function runSlashCommand(cmd) {
    try {
        const args = parseArgsFromInput()
        cmd?.run?.(args)
    } finally {
        newMessage.value = ''
        closeSlashMenu()
    }
}

function onScroll() {
    if (isScrollingProgrammatically) return

    const container = messagesContainer.value
    if (!container) return

    if (container.scrollTop <= 50 && !loading && !isOffline.value) {
        loadOlderMessages()
    }
}

const typingMenuOpen = ref(false)
let hoverTimer

function hoverOpen() {
    if (slashMenuOpen.value) slashMenuOpen.value = false
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => { typingMenuOpen.value = true }, 60)
}
function hoverScheduleClose() {
    clearTimeout(hoverTimer)
    hoverTimer = setTimeout(() => { typingMenuOpen.value = false }, 120)
}
function hoverCancel() {
    clearTimeout(hoverTimer)
}

watch(
    () => route.params.id,
    async () => {
        await checkChannelExists()
        resetMessages()

        isScrollingProgrammatically = true

        if (!isOffline.value) {
            await fetchMessages()
        }
        await getChannelMeta()
        await nextTick()
        scrollToBottom()

        setTimeout(() => {
            isScrollingProgrammatically = false
        }, 300)
    }
)

watch(userStatus, async (newStatus, oldStatus) => {
    if (oldStatus === 'offline' && newStatus !== 'offline') {
        console.log('User came back online, reloading messages')
        resetMessages()
        await fetchMessages()
        await getChannelMeta()
        await nextTick()
        scrollToBottom()
    }
})

function resetMessages() {
    messages.value = []
    currentPage = 1
    hasMoreMessages.value = true 
}

function scrollToBottom() {
    if (!messagesContainer.value) return

    isScrollingProgrammatically = true
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    setTimeout(() => { isScrollingProgrammatically = false }, 100)
}

async function sendMessage() {
   

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

    const optimisticMessage = {
        id: `temp-${Date.now()}`,
        body: text,
        userId: currentUser.id,
        user_nickname: currentUser.nickname,
        created_at: now.toISOString(),
        channelId: channelId.value
    }

    messages.value.push(optimisticMessage)
    newMessage.value = ''

    await nextTick()
    scrollToBottom()

    try {
        const response = await axios.post(
            `${API_URL}/message`,
            {
                body: text,
                channelId: channelId.value,
                userId: currentUser.id,
                createdAt: now.toISOString()
            },
            {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
                },
            }
        )

        console.log('Message sent successfully:', response.data)

        const realMessage = response.data.data
        const index = messages.value.findIndex(m => m.id === optimisticMessage.id)
        if (index !== -1) {
            messages.value[index] = realMessage
        }

    } catch (error) {
        console.error('Failed to send message:', error)

        const index = messages.value.findIndex(m => m.id === optimisticMessage.id)
        if (index !== -1) {
            messages.value.splice(index, 1)
        }

        $q.notify({
            message: 'Failed to send message. Please try again.',
            color: 'negative',
            icon: 'error'
        })
    }
}

async function getChannelMeta() {

    if (isChannelRoute.value === false) return


    const res = await axios.get(`${API_URL}/channels/${channelId.value}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('auth.token')}` }
    })

    console.log('Fetched channel meta:', res.data)

    channelMeta.value = res.data.data.channel
    membership.value = res.data.data.membership
    members.value = res.data.data.members
}

async function fetchLatestMessage() {
    if (isOffline.value || isChannelRoute.value === false) return

    try {
        const response = await axios.get(`${API_URL}/channels/${channelId.value}/messages`, {
            params: {
                page: 1,  
                limit: 1,  
            },
            headers: {
                Authorization: `Bearer ${localStorage.getItem('auth.token')}`,
            },
        })

        const fetchedMessages = response.data.data.data
        console.log('Fetched latest message:', fetchedMessages)

        if (Array.isArray(fetchedMessages) && fetchedMessages.length > 0) {
            const latestMessage = fetchedMessages[0]

            const exists = messages.value.some(m => m.id === latestMessage.id)

            if (!exists) {
                messages.value.push(latestMessage)

                await nextTick()
                scrollToBottom()
            }
        }
    } catch (err) {
        console.error('Failed to fetch latest message:', err)
    }
}

const userChannels = ref([]);

async function getCurrentChannels(){
    try {
        const res = await fetch(`${API_URL}/channels/members`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('auth.token')}`,
                'Content-Type': 'application/json'
            }
        });
        const data = await res.json();
        userChannels.value = data.data || [];
        console.log('[FE] User channels fetched:', userChannels);
    } catch (err) {
        console.error('[FE] Failed to fetch user channels:', err);
    }
}

const loadChannels = inject('loadChannels')

onMounted(async () => {
    console.log('[FE] onMounted triggered');

    await loadInitialSettings();
    console.log('[FE] Initial settings loaded');

    if (Notification.permission === 'default') {
        requestNotificationPermission();
        console.log('[FE] Notification permission requested');
    }

    if (isOffline.value) {
        console.log('[FE] User is offline - skipping subscriptions and data load');
        getChannelMeta();
        return;
    }

    await getCurrentChannels();

    if (!userChannels.value.some(c => c.channel_id == channelId.value)) {
        console.log('[FE] Current channel no longer exists for user, redirecting to /');
        console.log('Current route:', router.currentRoute.value.fullPath);
        resetMessages();
        await loadChannels();

        await router.push('/');
    }

    const subscription = transmit.subscription(`user/${currentUser.id}`);
    console.log('[FE] Creating subscription for user:', currentUser.id);

    subscription.onMessage(async (payload) => {
        console.log('[FE] Payload received:', payload);

        
        if(payload.event === 'refresh' && currentUser.id !== payload.userId){
          console.log("------- ChatWindow ------- component received refresh event!")
          await checkChannelExists()
          if(!channelExists.value){
            await loadChannels()
            resetMessages()
          }
          else{
            await getCurrentChannels()
            if(!userChannels.value.some(c => c.channel_id == channelId.value)){
              console.log('[FE] Current channel no longer exists for user, redirecting to /');
              router.replace('/');
              resetMessages()
              await loadChannels()
              return;
            }
            await getChannelMeta()
            await loadChannels()
          }
        }

        if (isOffline.value) {
            console.log('[FE] Ignoring payload because user is offline');
            return;
        }


        if (!userChannels.value.some(c => c.channel_id == payload.channelId)) {
            console.log('[FE] Ignoring payload for unknown channel:', payload.channelId);
            return;
        }


        if (payload.event === 'new-message') {
            if (payload.message.userId === currentUser.id) {
                console.log('[FE] Ignoring own message:', payload.message.id);
                return;
            }

            const exists = messages.value.some(m => m.id === payload.message.id);
            if (!exists && payload.channelId === channelId.value) {
                messages.value.push(payload.message);
                nextTick(() => scrollToBottom());
                showBrowserNotification(payload);
            } else {
                showBrowserNotification(payload);
                fetchLatestMessage();
            }
        }

        if (payload.event == 'user-typing') {
            console.log('[FE] Typing event received from user:', payload.userId);
            if (payload.userId === currentUser.id) {
                console.log('[FE] Ignoring own typing event');
                return;
            }

            if (!isChannelRoute.value) return;

            console.log('channelId:', payload.channelId);
            console.log('channelId.value:', channelId.value);
            console.log('Are they equal?', payload.channelId === channelId.value);
            if (payload.channelId === channelId.value) {
                if (!payload.text || payload.text.trim() === '') {
                    typingUsers.value.delete(payload.userId);
                    console.log('[FE] User stopped typing:', payload.userId);
                } else {
                    typingUsers.value.set(payload.userId, {
                        nickname: payload.user_nickname,
                        text: payload.text,
                        timestamp: Date.now()
                    });
                    console.log('[FE] User typing updated:', payload.userId, payload.text);
                }
            }
        }
    });

    subscription.create();
    console.log('[FE] Subscription created successfully');

    fetchMessages().then(() => {
        nextTick(() => scrollToBottom());
        console.log('[FE] Messages fetched and scrolled to bottom');
    });

    getChannelMeta();
    console.log('[FE] Channel metadata loaded');
});




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

.message-row {
    display: flex;
    width: 100%;
}

.message-row-left {
    justify-content: flex-start;
}

.message-row-right {
    justify-content: flex-end;
}



.bg-highlight {
    background: rgb(65, 65, 45);
}

.no-hover:hover,
.no-hover:focus {
    background: transparent;
    cursor: default;
}
</style>