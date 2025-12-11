<template>
  <div class="q-pa-md flex flex-center">
    <q-card class="q-pa-lg absolute-center" style="width: 94%; max-width: 500px;">
      <q-card-section>

        <div class="text-h6 text-center q-mb-md">
          {{ isRegister ? 'Register' : 'Login' }}
        </div>

        <q-form ref="formRef" @submit.prevent="onSubmit">
          <template v-if="isRegister">
            <q-input
              filled
              v-model="registerForm.name"
              label="Name"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required, rules.min2]"
              hint="At least 2 characters"
              clearable
            />
            <q-input
              filled
              v-model="registerForm.lastName"
              label="Last Name"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required, rules.min2]"
              hint="At least 2 characters"
              clearable
            />
            <q-input
              filled
              v-model="registerForm.email"
              label="Email"
              type="email"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required, rules.email]"
              hint="Use a valid email address"
              clearable
            />
            <q-input
              filled
              v-model="registerForm.nickname"
              label="Nickname"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required, rules.min3]"
              hint="Must be unique; 3+ characters"
              clearable
            />
            <q-input
              filled
              v-model="registerForm.password"
              :type="showPwd ? 'text' : 'password'"
              label="Password"
              class="q-mb-xs"
              color="teal-7"
              dense
              :rules="[rules.required, rules.min8]"
              hint="Minimum 8 characters"
              clearable
            >
              <template #append>
                <q-icon
                  :name="showPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPwd = !showPwd"
                />
              </template>
            </q-input>

            <div class="q-mb-md text-caption">
              <div class="row items-center q-gutter-xs">
                <q-icon :name="reqs.name ? 'check_circle' : 'radio_button_unchecked'" :color="reqs.name ? 'positive' : 'grey-5'" />
                <span>Name: at least 2 characters</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon :name="reqs.lastName ? 'check_circle' : 'radio_button_unchecked'" :color="reqs.lastName ? 'positive' : 'grey-5'" />
                <span>Last name: at least 2 characters</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon :name="reqs.email ? 'check_circle' : 'radio_button_unchecked'" :color="reqs.email ? 'positive' : 'grey-5'" />
                <span>Valid email address</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon :name="reqs.nickname ? 'check_circle' : 'radio_button_unchecked'" :color="reqs.nickname ? 'positive' : 'grey-5'" />
                <span>Nickname: 3+ characters (must be unique)</span>
              </div>
              <div class="row items-center q-gutter-xs">
                <q-icon :name="reqs.password ? 'check_circle' : 'radio_button_unchecked'" :color="reqs.password ? 'positive' : 'grey-5'" />
                <span>Password: at least 8 characters</span>
              </div>
            </div>
          </template>

          <template v-else>
            <q-input
              filled
              v-model="loginForm.username"
              label="Username or Email"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required]"
              clearable
            />
            <q-input
              filled
              v-model="loginForm.password"
              :type="showPwd ? 'text' : 'password'"
              label="Password"
              class="q-mb-md"
              color="teal-7"
              dense
              :rules="[rules.required]"
              clearable
            >
              <template #append>
                <q-icon
                  :name="showPwd ? 'visibility_off' : 'visibility'"
                  class="cursor-pointer"
                  @click="showPwd = !showPwd"
                />
              </template>
            </q-input>
          </template>

          <q-btn
            :label="isRegister ? 'Register' : 'Login'"
            color="teal-7"
            type="submit"
            class="full-width"
            unelevated
            :loading="isSubmitting"
            :disable="isSubmitting || (isRegister && !allReqsMet)"
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
import { ref, computed, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const $q = useQuasar()
const API_URL = import.meta.env.VITE_API_URL

const router = useRouter()
const isRegister = ref(false)
const isSubmitting = ref(false)
const formError = ref('')
const showPwd = ref(false)

const formRef = ref(null)

const loginForm = ref({ username: '', password: '' })
const registerForm = ref({ name: '', lastName: '', email: '', nickname: '', password: '' })

function toggleMode() {
  formError.value = ''
  isRegister.value = !isRegister.value
  nextTick(() => formRef.value?.resetValidation?.())
}

const rules = {
  required: v => (!!v || v === 0) || 'This field is required',
  min2: v => (v && String(v).trim().length >= 2) || 'Minimum 2 characters',
  min3: v => (v && String(v).trim().length >= 3) || 'Minimum 3 characters',
  min8: v => (v && String(v).length >= 8) || 'Minimum 8 characters',
  email: v => (/^\S+@\S+\.\S+$/.test(String(v)) || 'Invalid email address'),
}

const reqs = computed(() => ({
  name: (registerForm.value.name || '').trim().length >= 2,
  lastName: (registerForm.value.lastName || '').trim().length >= 2,
  email: /^\S+@\S+\.\S+$/.test(registerForm.value.email || ''),
  nickname: (registerForm.value.nickname || '').trim().length >= 3,
  password: (registerForm.value.password || '').length >= 8,
}))
const allReqsMet = computed(() => Object.values(reqs.value).every(Boolean))

async function onSubmit () {
  formError.value = ''

  const valid = await formRef.value.validate()
  if (!valid) return

  isSubmitting.value = true
  try {
    if (isRegister.value) {
      await doRegister()
    } else {
      await doLogin()
    }
  } catch (err) {
    formError.value = humanizeError(err)
    $q.notify({ type: 'negative', message: formError.value, icon: 'error' })
  } finally {
    isSubmitting.value = false
  }
}

async function doLogin() {
  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(loginForm.value),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw { status: res.status, data }

    if (!data.token) throw new Error('No token returned from login')

    localStorage.setItem('auth.token', data.token)
    localStorage.setItem('auth.user', JSON.stringify(data.user))
    console.log(localStorage.getItem('auth.token')?.length)
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: data.user }))
    router.push('/')
  } catch (err) {
    console.error('Login failed', err)

    const backendError =
      err?.data?.error ||
      err?.data?.message ||
      (Array.isArray(err?.data?.errors) && err.data.errors[0]?.message)

    const message = backendError || 'Login failed. Please check your credentials.'

    $q.notify({
      message,
      color: 'negative',
      icon: 'error',
    })
    
  }
}


async function doRegister () {
    const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(registerForm.value),
    })
    const data = await res.json().catch(() => ({}))

    if (!res.ok) throw { status: res.status, data }

    localStorage.setItem('auth.token', data.token)
    console.log("[][][] TOKEN LENGTH FROM REGISTER: " + localStorage.getItem('auth.token')?.length)
    localStorage.setItem('auth.user', JSON.stringify(data.user))
    window.dispatchEvent(new CustomEvent('auth:changed', { detail: data.user }))
    router.push('/')
}

function humanizeError (err) {
  if (err?.status === 409 && Array.isArray(err?.data?.errors)) {
    return err.data.errors.map(e => e.message).join(' • ')
  }
  const msgFromArray = err?.data?.errors?.[0]?.message
  if (msgFromArray) return msgFromArray

  switch (err?.status) {
    case 401: return 'Invalid username or password'
    case 409: return 'Email or nickname already in use'
    default: return 'Something went wrong. Please try again.'
  }
}
</script>
