<template>
  <q-layout view="lHh Lpr lFf">
    
    <app-header :show-menu="false" title="Login" />
    

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup>
import AppHeader from 'src/components/AppHeader.vue'

</script>