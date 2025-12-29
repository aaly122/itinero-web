<script setup>
    import { useFormStore } from '@/store/formStore.js';
    import { ref, computed } from 'vue';
    import { VueDraggable } from 'vue-draggable-plus';
    import { useRouter } from 'vue-router';
    import Button from 'primevue/button';
    import Chip from 'primevue/chip';
    
    const router = useRouter();
    const formStore = useFormStore();
    
    // --- DATA LOGIC (SAME AS BEFORE) ---
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
    
    const otherStops = computed(() => {
        const currentItineraryIds = [
            startStop.value?.placeId || startStop.value?.id,
            ...draggableStops.value.map(stop => stop.placeId || stop.id),
            endStop.value?.placeId || endStop.value?.id
        ].filter(Boolean)
    
        return formStore.tripData.otherResults.flatMap(type =>
            type.places
                .filter(place => !currentItineraryIds.includes(place.id))
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
    
    const startStop = computed(() => stops[0])
    const endStop = computed(() => stops[stops.length - 1])
    const draggableStops = ref(stops.slice(1, -1))
    
    const handleDragEnd = () => {}
    
    const addStop = (stopToAdd) => {
        if (draggableStops.value.length >= 6) {
            alert('Maximum of 6 stops allowed in the itinerary.')
            return
        }
        draggableStops.value.push({
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
        })
    }
    
    const removeStop = (index) => {
        draggableStops.value.splice(index, 1)
    }
    
    const getSortedStops = () => [startStop.value, ...draggableStops.value, endStop.value]
    
    const updateFormStore = async () => {
        const sortedStops = getSortedStops()
        const recalculateData = {
            ordered_stops: sortedStops.map(stop => ({
                interestType: stop.tag,
                places: {
                    displayName: { text: stop.title },
                    formattedAddress: stop.address,
                    id: stop.placeId || stop.id || 'unknown',
                    location: { latitude: stop.lat, longitude: stop.lng }
                }
            })),
            timeAllotted: formStore.tripData.timeAllotted
        }
        await formStore.recalculateItinerary(recalculateData)
    }
    </script>
    
    <template>
        <section class="w-screen gradient-1 flex flex-col md:flex-row md:h-screen md:overflow-hidden h-full overflow-y-auto animate-enter" style="--delay:0s">
            
            <section class="w-full md:w-[30%] min-h-[85vh] md:min-h-0 md:h-full bg-transparent p-4 md:ml-20 shrink-0">
                <div class="w-full h-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden card pb-20 md:pb-0">
                    
                    <div class="p-4 border-b border-slate-100 md:hidden">
                        <h2 class="font-bold text-xl text-slate-800">Your Route</h2>
                        <p class="text-sm text-slate-500">Drag items to reorder</p>
                    </div>
    
                    <div id="lowerBox" class="h-full rounded-xl flex flex-col p-2 gap-2 md:overflow-y-auto">
                        <div class="w-full bg-white relative card animate-enter shrink-0" style="min-height: 13.75rem; --delay:0.1s">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-xl text-slate-800 flex-1 overflow-hidden">{{ startStop.title }}</h3>
                                <Chip label="Start" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                            </div>
                            <p class="text-slate-700 italic text-md mb-2 overflow-hidden">{{ startStop.address }}</p>
                            <div class="flex items-center gap-2 text-sm">
                                <span class="text-slate-700 font-medium">{{ startStop.arrivalTime }}</span>
                                <span class="text-slate-700 font-medium">{{ startStop.departureTime }}</span>
                                <span class="text-slate-500 italic">Starting point</span>
                            </div>
                        </div>
    
                        <VueDraggable v-model="draggableStops" @end="handleDragEnd" class="space-y-2">
                            <div
                                v-for="(stop, index) in draggableStops"
                                :key="`draggable-${stop.title}-${index}`"
                                class="w-full bg-white card relative cursor-move transition-all duration-200 hover:shadow-xl hover:scale-[1.01]"
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
                                    <span class="text-slate-600">{{ stop.distance }}m leg</span>
                                </div>
                                <Button @click="removeStop(index)" icon="pi pi-trash" severity="danger" size="small" rounded class="absolute top-2 right-2 w-8 h-8"/>
                            </div>
                        </VueDraggable>
    
                        <div class="w-full bg-white relative card animate-enter shrink-0" style="min-height: 13.75rem; --delay:0.3s">
                            <div class="flex justify-between items-start mb-2">
                                <h3 class="font-bold text-xl text-slate-800 flex-1 overflow-hidden">{{ endStop.title }}</h3>
                                <Chip label="End" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                            </div>
                            <p class="text-slate-700 italic text-md mb-2 overflow-hidden">{{ endStop.address }}</p>
                            <div class="flex items-center gap-2 text-sm">
                                <span class="text-slate-700 font-medium">{{ endStop.arrivalTime }}</span>
                                <span class="text-slate-700 font-medium">{{ endStop.departureTime }}</span>
                                <span class="text-slate-500 italic">Ending point</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
    
            <section class="w-full md:w-[70%] h-auto md:h-full p-4 flex flex-col bg-white/50 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none">
                
                <div class="flex-none mb-4 px-2 pt-4 md:pt-0">
                    <div class="text-2xl md:text-3xl font-bold">Add Stops</div>
                    <div class="text-sm text-slate-600">
                        Stops: {{ draggableStops.length }}/6
                        <span v-if="draggableStops.length >= 6" class="text-red-500 font-medium">(Max reached)</span>
                    </div>
                </div>
                
                <div class="md:flex-1 md:overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4 pb-32 md:pb-4">
                    <div
                        v-for="(stop, stopIndex) in otherStops"
                        :key="stop.title"
                        class="h-auto min-h-[10rem] md:h-40 w-full card bg-white p-3 flex flex-col justify-between hover:bg-slate-100 transition-all cursor-pointer animate-enter"
                    >
                        <div>
                            <p class="font-bold text-lg mb-1 text-slate-700 leading-tight">{{ stop.title }}</p>
                            <p class="text-sm text-slate-600 mb-2 line-clamp-2">{{ stop.address }}</p>
                        </div>
                        <div class="flex justify-between items-center mt-2">
                            <Chip :label="stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1)" class="border-1 border-slate-300 flex justify-center p-1 text-sm w-15 rounded-xl"/>
                            <Button @click="addStop(stop)" :disabled="draggableStops.length >= 6" rounded class="w-auto px-4 interactive-btn-secondary text-sm">Add</Button>
                        </div>
                    </div>
                </div>
    
                <div class="hidden md:flex md:flex-none md:justify-end md:items-center md:h-[15%]">
                    <div class="flex gap-2 w-auto">
                        <Button @click="router.push('/Dashboard')" label="Cancel" severity="secondary" class="w-45 interactive-btn-secondary" rounded/>
                        <Button @click="updateFormStore" label="Save Changes" severity="primary" class="w-45 interactive-btn-primary" rounded/>
                    </div>
                </div>
    
            </section>
        </section>
    
        <Teleport to="body">
            <div class="md:hidden fixed bottom-16 left-0 w-full bg-white/95 backdrop-blur-md p-4 border-t border-slate-200 z-[9999] shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)]">
                <div class="flex gap-2 w-full">
                    <Button @click="router.push('/Dashboard')" label="Cancel" severity="secondary" class="flex-1 interactive-btn-secondary" rounded/>
                    <Button @click="updateFormStore" label="Save" severity="primary" class="flex-1 interactive-btn-primary" rounded/>
                </div>
            </div>
        </Teleport>
    
    </template>