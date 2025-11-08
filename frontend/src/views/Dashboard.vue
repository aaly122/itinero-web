<script setup>
import Map from '@/components/Map.vue';
import { useFormStore } from '@/store/formStore.js';


const formStore = useFormStore();

console.log("Form store:", formStore.tripData.stops)
</script>

<template>
  <div class="overflow-hidden">
   <Map /> 
  </div>

</template>

<style scoped></style>
