<script setup>
import Map from '@/components/Map.vue';
import { useFormStore } from '@/store/formStore.js';
import { useRouter } from 'vue-router';

import { onBeforeMount } from 'vue';

const router = useRouter();
const formStore = useFormStore();
onBeforeMount(() => {

        if (!formStore.tripData || !formStore.tripData.stops) {
            router.push('/Create'); 
        }
    });
</script>

<template>
  <div v-if="formStore.tripData && formStore.tripData.stops" class="overflow-hidden">
   <Map /> 
  </div>
  <div v-else class="flex h-screen w-screen items-center justify-center">
        <p>Redirecting...</p>
  </div>

</template>

<style scoped></style>
