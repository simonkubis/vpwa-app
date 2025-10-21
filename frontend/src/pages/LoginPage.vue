<template>
    <div class="q-pa-md flex flex-center">
        <q-card class="q-pa-lg absolute-center" style="width: 94%; max-width: 500px;">
            <q-card-section>
                <div class="text-h6 text-center q-mb-md">
                    {{ isRegister ? 'Register' : 'Login' }}
                </div>
                <q-form @submit.prevent="isRegister ? register() : login()">
                    <template v-if="isRegister">
                        <q-input
                            filled
                            v-model="registerForm.name"
                            label="Name"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                        <q-input
                            filled
                            v-model="registerForm.lastName"
                            label="Last Name"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                        <q-input
                            filled
                            v-model="registerForm.email"
                            label="Email"
                            type="email"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                        <q-input
                            filled
                            v-model="registerForm.nickname"
                            label="Nickname"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                        <q-input
                            filled
                            v-model="registerForm.password"
                            label="Password"
                            type="password"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                    </template>
                    <template v-else>
                        <q-input
                            filled
                            v-model="loginForm.username"
                            label="Username"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                        <q-input
                            filled
                            v-model="loginForm.password"
                            label="Password"
                            type="password"
                            class="q-mb-md"
                            color="teal-7"
                            dense
                            required
                        />
                    </template>
                    <q-btn
                        :label="isRegister ? 'Register' : 'Login'"
                        color="teal-7"
                        type="submit"
                        class="full-width"
                        unelevated
                    />
                </q-form>
                <div class="q-mt-md text-center">
                    <q-btn
                        flat
                        :label="isRegister ? 'Already have an account? Login.' : 'Don\'t have an account? Register.'"
                        color="teal-7"
                        class="q-pa-none"
                        @click="toggleMode"
                    />
                </div>
            </q-card-section>
        </q-card>
    </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

const isRegister = ref(false)

const loginForm = ref({
    username: '',
    password: ''
})

const registerForm = ref({
    name: '',
    lastName: '',
    email: '',
    nickname: '',
    password: ''
})

function toggleMode() {
    isRegister.value = !isRegister.value
}

function login() {

    // len zatial na demo, ked bude backend overovat
    router.push('/')
}

function register() {
    
     // len zatial na demo, ked bude backend overovat
    router.push('/')
}
</script>
