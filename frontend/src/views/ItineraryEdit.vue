<script setup>
import { useFormStore } from '@/store/formStore.js';
import { ref, computed } from 'vue';
import { VueDraggable } from 'vue-draggable-plus';
import { useRouter } from 'vue-router';
import Button from 'primevue/button';
import Chip from 'primevue/chip';

const router = useRouter();

const formStore = useFormStore();

// Transform itinerary stops data
const stops = formStore.tripData.stops.map((place, index) => ({
    tag: place.interestType,
    title: place.places.displayName.text,
    address: place.places.formattedAddress,
    distance: formStore.tripData.distances[index] || 0,
    duration: formStore.tripData.durations[index] || 0,
    lat: place.places.location.latitude,
    lng: place.places.location.longitude,
    arrivalTime: place.arrival_time,
    departureTime: place.leave_time,
    id: place.places.id,
    placeId: place.places.id
}))

// Transform alternative stops data, filtering out stops already in current itinerary
const otherStops = computed(() => {
    // Get all place IDs currently in the itinerary (start + current draggable stops + end)
    const currentItineraryIds = [
        startStop.value?.placeId || startStop.value?.id,
        ...draggableStops.value.map(stop => stop.placeId || stop.id),
        endStop.value?.placeId || endStop.value?.id
    ].filter(Boolean) // Remove any undefined values

    return formStore.tripData.otherResults.flatMap(type =>
        type.places
            .filter(place => !currentItineraryIds.includes(place.id)) // Exclude already added stops
            .map(place => ({
                tag: type.interestType,
                title: place.displayName.text,
                address: place.formattedAddress,
                id: place.id,
                lat: place.location.latitude,
                lng: place.location.longitude,
            }))
    )
})

// Separate fixed and draggable stops
const startStop = computed(() => stops[0])
const endStop = computed(() => stops[stops.length - 1])
const draggableStops = ref(stops.slice(1, -1)) // Middle stops only

// Handle reordering of draggable stops
const handleDragEnd = () => {
    // Stops have been reordered via v-model binding
}

// Add a stop from otherStops to the draggable itinerary
const addStop = (stopToAdd) => {
    // Check if we've reached the maximum of 6 stops
    if (draggableStops.value.length >= 6) {
        alert('Maximum of 6 stops allowed in the itinerary.')
        return
    }

    const newStop = {
        tag: stopToAdd.tag,
        title: stopToAdd.title,
        address: stopToAdd.address,
        distance: 0,
        duration: 0,
        lat: stopToAdd.lat,
        lng: stopToAdd.lng,
        arrivalTime: '--:--',
        departureTime: '--:--',
        placeId: stopToAdd.id
    }
    draggableStops.value.push(newStop)
}

// Remove a stop from the draggable itinerary
const removeStop = (index) => {
    draggableStops.value.splice(index, 1)
}

// Get sorted stops array (for easy access)
const getSortedStops = () => [startStop.value, ...draggableStops.value, endStop.value]

// Update the form store with new order and recalculate distances/times
const updateFormStore = async () => {
    const sortedStops = getSortedStops()

    // Prepare data for backend recalculation
    const recalculateData = {
        ordered_stops: sortedStops.map(stop => ({
            interestType: stop.tag,
            places: {
                displayName: { text: stop.title },
                formattedAddress: stop.address,
                id: stop.placeId || stop.id || 'unknown',
                location: {
                    latitude: stop.lat,
                    longitude: stop.lng
                }
            }
        })),
        timeAllotted: formStore.tripData.timeAllotted
    }

    // Call the form store's recalculateItinerary function
    await formStore.recalculateItinerary(recalculateData)
}

// Functions are accessible within the component scope
</script>

<template>
    <section class="h-full w-screen gradient-1 flex flex-col md:flex-row overflow-hidden animate-enter" style="--delay:0s">
        <section class="w-full md:w-[30%] h-full bg-transparent p-4 md:ml-20 min-h-[50vh] md:min-h-0">
            <div class="w-full h-full bg-white rounded-xl shadow-2xl flex flex-col overflow-y-scroll overflow-x-hidden card">
                <div id="lowerBox" class="h-full rounded-xl flex flex-col p-2 gap-2 overflow-y-scroll">

                    <!-- Fixed Start Stop -->
                    <div class="w-full bg-white relative card animate-enter" style="min-height: 13.75rem; --delay:0.1s">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-xl text-slate-800 flex-1 overflow-hidden">{{ startStop.title }}</h3>
                            <Chip label="Start" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                        </div>
                        <p class="text-slate-700 italic text-md mb-2 overflow-hidden">{{ startStop.address }}</p>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-slate-700 font-medium">{{ startStop.arrivalTime }}</span>
                            <span class="text-slate-700 font-medium">{{ startStop.departureTime }}</span>
                            <span class="text-slate-500 italic">Fixed starting point</span>
                        </div>
                    </div>

                    <!-- Draggable Middle Stops -->
                    <VueDraggable v-model="draggableStops" @end="handleDragEnd" class="space-y-2">
                        <div
                            v-for="(stop, index) in draggableStops"
                            :key="`draggable-${stop.title}-${index}`"
                            class="w-full bg-white card relative cursor-move transition-all duration-200 hover:shadow-xl hover:transform hover:scale-[1.02]"
                            style="min-height: 13.75rem; --delay:0.2"
                        >
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-xl text-slate-800 flex-1 overflow-hidden">{{ stop.title }}</h3>
                                <Chip :label="stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1)" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                            </div>
                            <p class="text-slate-700 italic text-md mb-2 overflow-hidden">{{ stop.address }}</p>
                            <div class="flex items-center gap-2 text-sm">
                                <span class="text-slate-700 font-medium">{{ stop.arrivalTime }}</span>
                                <span class="text-slate-700 font-medium">{{ stop.departureTime }}</span>
                                <span class="text-slate-600">{{ stop.distance }} meters from last stop</span>
                            </div>

                            <!-- Remove button -->
                            <Button
                                @click="removeStop(index)"
                                icon="pi pi-trash"
                                severity="danger"
                                size="small"
                                rounded
                                class="absolute top-2 right-2 w-8 h-8"
                                title="Remove stop"
                            />
                        </div>
                    </VueDraggable>

                    <!-- Fixed End Stop -->
                    <div class="w-fullbg-white relative card animate-enter" style="min-height: 13.75rem; --delay:0.3s">
                        <div class="flex justify-between items-start mb-2">
                            <h3 class="font-bold text-xl text-slate-800 flex-1 overflow-hidden">{{ endStop.title }}</h3>
                            <Chip label="End" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>                        </div>
                        <p class="text-slate-700 italic text-md mb-2 overflow-hidden">{{ endStop.address }}</p>
                        <div class="flex items-center gap-2 text-sm">
                            <span class="text-slate-700 font-medium">{{ endStop.arrivalTime }}</span>
                            <span class="text-slate-700 font-medium">{{ endStop.departureTime }}</span>
                            <span class="text-slate-500 italic">Fixed ending point</span>
                        </div>
                    </div>
                </div>

            </div>


        </section>
        <section class="w-full md:w-[70%] h-full md:h-[100dvh] p-4 flex flex-col min-h-[50vh] md:min-h-0">
            <div class="text-2xl md:text-3xl font-bold mb-4">
                Edit Itinerary
            </div>
            <div class="text-sm text-slate-600 mb-4">
                Stops: {{ draggableStops.length }}/6
                <span v-if="draggableStops.length >= 6" class="text-red-500 font-medium">(Maximum reached)</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-4 p-2 md:p-4 h-full overflow-y-scroll">
                <div
                    v-for="(stop, stopIndex) in otherStops"
                    :key="stop.title"
                    class="h-40 md:h-40 w-full card bg-white p-4 md:p-3 flex flex-col justify-between hover:bg-slate-100 transition-all line-clamp-1 cursor-pointer animate-enter" style="--delay:0s"
                >
                    <div>
                        <p class="font-bold text-lg mb-1 text-slate-700">{{ stop.title }}</p>
                        <p class="text-sm text-slate-600 mb-2 line-clamp-2">{{ stop.address }}</p>
                    </div>
                    <div class="flex justify-between items-center">
                        <Chip :label="stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1)" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                        <Button
                            @click="addStop(stop)"
                            :disabled="draggableStops.length >= 6"
                            :severity="draggableStops.length >= 6 ? 'secondary' : 'secondary'"
                            rounded
                            class="w-full md:w-35 text-sm interactive-btn-secondary"
                        >
                            Add to Itinerary
                        </Button>
                    </div>
                </div>
            </div>

            <div class="flex justify-center md:justify-end items-center h-[15%] w-full">
                <div class="flex gap-2 w-full md:w-auto">
                    <Button @click="router.push('/Dashboard')" label="Cancel" severity="secondary" class="flex-1 md:w-45 interactive-btn-secondary" rounded/>
                    <Button @click="updateFormStore" label="Save" severity="primary" class="flex-1 md:w-45 interactive-btn-primary" rounded/>
                </div>
            </div>
        </section>
    </section>
</template>