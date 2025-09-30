<template>
  <q-page class="flex column q-pa-md">
    <!-- Conversation window -->
    <div class="col q-pa-md scroll bg-teal-2 rounded-borders">
      
    </div>

    <!-- Input bar -->
    <div class="bg-white q-mt-md">
      <q-input
        placeholder="Type a message..."
        filled
        color="teal-7"
      >
        <template v-slot:append>
          <q-btn flat icon="send" />
        </template>
      </q-input>
    </div>
  </q-page>
</template>

<script setup>




</script>
