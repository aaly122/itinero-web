<script setup>
import { onMounted, watch, computed, onUnmounted } from 'vue';
import { useFormStore } from '@/store/formStore';
import { newMarker, mapReady, initMap, clearMapInstance } from '@/composables/useMap';

const mapContainer = 'map-container';

const formStore = useFormStore();
// const stops = formStore.tripData.stops


const allLocationCoords = computed(() => {
    const stops = formStore.tripData.stops; 
    
    if (!stops || stops.length === 0) {
        return [];
    }
    const locations = [];
    
    stops.forEach((place) => {
        locations.push({
            lat: place.places.location.latitude, 
            lng: place.places.location.longitude,

            title: place.places.displayName.text 
        })
    })
    return locations;
});

watch(allLocationCoords, (newLocations) => {
    if (newLocations.length > 0) {
        newMarker(newLocations);
        console.log(`Map updated with ${newLocations.length} locations.`);
    } else {
        newMarker([]); 
    }
}, { deep: true }); 

onMounted(() => {
  initMap(mapContainer);
  mapReady.then(() => {
        console.log('Map is fully initialized and ready for commands.');
        newMarker(allLocationCoords.value);
    });
});

onUnmounted(() => {
    clearMapInstance(); 
});


</script>

<template>
  <div :id="mapContainer" class="w-screen h-[100dvh]"></div>
</template>

<style scoped>
</style>