<script setup>
    import { useFormStore } from '@/store/formStore.js';
    import { ref, computed } from 'vue';
    import { VueDraggable } from 'vue-draggable-plus';
    import { useRouter } from 'vue-router';
    import Button from 'primevue/button';
    import Chip from 'primevue/chip';
    
    const router = useRouter();
    const formStore = useFormStore();
    
    // --- HELPER: Time String Manipulation ---
    const adjustTimeString = (timeStr, minutesToAdd) => {
        if (!timeStr || timeStr === '--:--') return timeStr;
        const [time, modifier] = timeStr.split(' ');
        let [hours, minutes] = time.split(':');
        hours = parseInt(hours);
        minutes = parseInt(minutes);
        if (hours === 12 && modifier === 'AM') hours = 0;
        if (hours !== 12 && modifier === 'PM') hours += 12;
        const date = new Date();
        date.setHours(hours, minutes + minutesToAdd);
        let newHours = date.getHours();
        const newMinutes = date.getMinutes();
        const newModifier = newHours >= 12 ? 'PM' : 'AM';
        newHours = newHours % 12 || 12;
        return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')} ${newModifier}`;
    }

    // --- DATA LOGIC ---
    const stops = formStore.tripData.stops.map((place, index) => ({
        tag: place.interestType,
        title: place.places.displayName.text,
        address: place.places.formattedAddress,
        distance: formStore.tripData.distances[index] || 0,
        durationSeconds: place.duration || (place.scheduled_activity_minutes ? place.scheduled_activity_minutes * 60 : 0),
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
    
    const startStop = ref(stops[0])
    const endStop = ref(stops[stops.length - 1])
    const draggableStops = ref(stops.slice(1, -1))
    
    const handleDragEnd = () => {}
    
    // --- MANUAL TIME ADJUSTMENT LOGIC ---
    const changeTime = (target, changeType, deltaMinutes) => {
        let stopToUpdate = null;
        if (target === 'start') {
            stopToUpdate = startStop.value;
            if (changeType === 'arrival') return; 
        } else if (target === 'end') {
             if (changeType === 'arrival') {
                 stopToUpdate = draggableStops.value.length > 0 ? draggableStops.value[draggableStops.value.length - 1] : startStop.value;
             } else {
                 return; 
             }
        } else {
            const idx = target;
            if (changeType === 'departure') {
                stopToUpdate = draggableStops.value[idx];
            } else {
                stopToUpdate = idx > 0 ? draggableStops.value[idx - 1] : startStop.value;
            }
        }

        if (!stopToUpdate) return;
        const newDuration = (stopToUpdate.durationSeconds || 0) + (deltaMinutes * 60);
        if (newDuration < 0) return;
        stopToUpdate.durationSeconds = newDuration;
        stopToUpdate.departureTime = adjustTimeString(stopToUpdate.departureTime, deltaMinutes);

        if (target === 'end' && changeType === 'arrival') {
            endStop.value.arrivalTime = adjustTimeString(endStop.value.arrivalTime, deltaMinutes);
        } else if (typeof target === 'number' && changeType === 'arrival') {
            draggableStops.value[target].arrivalTime = adjustTimeString(draggableStops.value[target].arrivalTime, deltaMinutes);
        }
    }

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
            durationSeconds: 1800, 
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
                duration: stop.durationSeconds, 
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
        
        const newStops = formStore.tripData.stops;
        startStop.value = { ...startStop.value, arrivalTime: newStops[0].arrival_time, departureTime: newStops[0].leave_time };
        endStop.value = { ...endStop.value, arrivalTime: newStops[newStops.length-1].arrival_time, departureTime: newStops[newStops.length-1].leave_time };
        
        draggableStops.value.forEach((dStop, i) => {
            const updated = newStops[i+1]; 
            if(updated) {
                dStop.arrivalTime = updated.arrival_time;
                dStop.departureTime = updated.leave_time;
            }
        });
    }
</script>
    
<template>
    <section class="w-screen gradient-1 flex flex-col md:flex-row md:h-screen md:overflow-hidden h-full overflow-y-auto animate-enter" style="--delay:0s">
        
        <section class="w-full md:w-[30%] min-h-[85vh] md:min-h-0 md:h-full bg-transparent p-4 md:ml-20 shrink-0">
            <div class="w-full h-full bg-white rounded-xl shadow-2xl flex flex-col overflow-hidden card pt-15 md:pb-0">
                
                <div class="p-4 border-b border-slate-100 md:hidden">
                    <h2 class="font-bold text-xl text-slate-800">Your Route</h2>
                    <p class="text-sm text-slate-500">Drag items to reorder</p>
                </div>

                <div id="lowerBox" class="h-full rounded-xl flex flex-col p-2 gap-2 md:overflow-y-auto">
                    
                    <div class="card bg-slate-100 w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.2)] p-4 flex flex-col gap-2 min-h-[140px] animate-enter shrink-0 relative" style="--delay:0.1s">
                        <div class="flex justify-between items-start w-full">
                            <div class="flex-1">
                                <p class="font-bold text-lg md:text-xl leading-tight text-slate-800">{{ startStop.title }}</p>
                            </div>
                        <Chip label="Start" class="border-1 border-slate-300 flex justify-center p-2 text-sm min-w-15 rounded-xl"/>
                        </div>
                        <p class="text-slate-700 italic text-md flex-1 overflow-hidden">{{ startStop.address }}</p>
                        
                        <div class="flex flex-col gap-1 text-sm mt-1 w-full border-t border-slate-200 pt-2">
                            <div class="flex items-center justify-between w-full">
                                <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-down-right text-slate-400"></i> Arrive:</span>
                                <span class="text-slate-700 font-medium">{{ startStop.arrivalTime }}</span>
                                <div class="w-[52px]"></div>
                            </div>
                            <div class="flex items-center justify-between w-full">
                                <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-up-right text-primary-500"></i> Depart:</span>
                                <div class="flex items-center gap-1">
                                    <Button @click="changeTime('start', 'departure', -15)" icon="pi pi-minus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                    <span class="text-slate-700 font-medium min-w-[4.5rem] text-center">{{ startStop.departureTime }}</span>
                                    <Button @click="changeTime('start', 'departure', 15)" icon="pi pi-plus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                </div>
                            </div>
                        </div>
                    </div>

                    <VueDraggable 
                        v-model="draggableStops" 
                        @end="handleDragEnd" 
                        class="space-y-2"
                        handle=".drag-handle"
                        :animation="200"
                        ghost-class="ghost-card"
                        drag-class="drag-active"
                    >
                        <div
                            v-for="(stop, index) in draggableStops"
                            :key="`draggable-${stop.title}-${index}`"
                            class="card bg-slate-100 w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.2)] p-4 flex flex-col gap-2 min-h-[140px] relative transition-all duration-200"
                            style="--delay:0.2"
                        >
                            <div class="flex justify-between items-start w-full"> 
                                <div class="flex items-start gap-2 flex-1">
                                    <p class="font-bold text-lg md:text-xl leading-tight text-slate-800">{{ stop.title }}</p>
                                </div>
                                <Chip :label="stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1)" class="border-1 border-slate-300 flex justify-center p-2 text-sm min-w-15 rounded-xl"/>
                                <div class="drag-handle cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 mt-1 touch-none pl-3">
                                    <i class="pi pi-bars text-lg" style="transform: rotate(90deg);"></i>
                                </div>
                            </div>

                            <p class="text-slate-700 italic text-md flex-1 overflow-hidden">{{ stop.address }}</p>
                            
                            <div class="flex flex-col gap-1 text-sm mt-1 w-full border-t border-slate-200 pt-2">
                                <div class="flex items-center justify-between w-full">
                                    <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-down-right text-slate-400"></i> Arrive:</span>
                                    <div class="flex items-center gap-1">
                                        <Button @click.stop="changeTime(index, 'arrival', -15)" icon="pi pi-minus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                        <span class="text-slate-700 font-medium min-w-[4.5rem] text-center">{{ stop.arrivalTime }}</span>
                                        <Button @click.stop="changeTime(index, 'arrival', 15)" icon="pi pi-plus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                    </div>
                                </div>
                                <div class="flex items-center justify-between w-full">
                                    <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-up-right text-primary-500"></i> Depart:</span>
                                    <div class="flex items-center gap-1">
                                        <Button @click.stop="changeTime(index, 'departure', -15)" icon="pi pi-minus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                        <span class="text-slate-700 font-medium min-w-[4.5rem] text-center">{{ stop.departureTime }}</span>
                                        <Button @click.stop="changeTime(index, 'departure', 15)" icon="pi pi-plus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                    </div>
                                </div>
                                <span class="text-slate-400 italic text-[10px] text-right mt-1 w-full block">{{ stop.distance }}m leg</span>
                            </div>

                            <Button @click="removeStop(index)" icon="pi pi-trash" severity="danger" size="small" rounded class="absolute top-2 right-2 w-7 h-7 !p-0"/>
                        </div>
                    </VueDraggable>

                    <div class="card bg-slate-100 w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.2)] p-4 flex flex-col gap-2 min-h-[140px] animate-enter shrink-0 relative" style="--delay:0.3s">
                        <div class="flex justify-between items-start w-full">
                             <div class="flex-1">
                                <p class="font-bold text-lg md:text-xl leading-tight text-slate-800">{{ endStop.title }}</p>
                            </div>
                            <Chip label="Start" class="border-1 border-slate-300 flex justify-center p-2 text-sm min-w-15 rounded-xl"/>
                        </div>
                        <p class="text-slate-700 italic text-md flex-1 overflow-hidden">{{ endStop.address }}</p>

                        <div class="flex flex-col gap-1 text-sm mt-1 w-full border-t border-slate-200 pt-2">
                            <div class="flex items-center justify-between w-full">
                                <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-down-right text-slate-400"></i> Arrive:</span>
                                <div class="flex items-center gap-1">
                                    <Button @click="changeTime('end', 'arrival', -15)" icon="pi pi-minus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                    <span class="text-slate-700 font-medium min-w-[4.5rem] text-center">{{ endStop.arrivalTime }}</span>
                                    <Button @click="changeTime('end', 'arrival', 15)" icon="pi pi-plus" severity="secondary" text rounded size="small" class="w-6 h-6 !p-0"/>
                                </div>
                            </div>
                            <div class="flex items-center justify-between w-full">
                                <span class="text-slate-500 flex items-center gap-1"><i class="pi pi-arrow-up-right text-primary-500"></i> Depart:</span>
                                <span class="text-slate-700 font-medium">{{ endStop.departureTime }}</span>
                                <div class="w-[52px]"></div> 
                            </div>
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
                    class="h-auto min-h-[10rem] md:min-h-40 w-full card bg-white p-3 flex flex-col justify-between hover:bg-slate-100 transition-all cursor-pointer animate-enter"
                >
                    <div>
                        <p class="font-bold text-lg mb-1 text-slate-700 leading-tight">{{ stop.title }}</p>
                        <p class="text-sm text-slate-600 mb-2 line-clamp-2">{{ stop.address }}</p>
                    </div>
                    <div class="flex justify-between items-center mt-2">
                        <Chip :label="stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1)" class="border-1 border-slate-300 flex justify-center p-2 text-sm min-w-15 rounded-xl"/>
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

<style scoped>
/* State when item is being moved - Gives it a "lifted" feel */
.drag-active {
    opacity: 0.9;
    transform: scale(1.02) rotate(1deg);
    box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
    cursor: grabbing;
    z-index: 50;
    border: 1px solid #94a3b8; /* slate-400 */
}

/* The placeholder where the item used to be */
.ghost-card {
    background-color: #f1f5f9; /* slate-100 */
    border: 2px dashed #cbd5e1; /* slate-300 */
    opacity: 0.6;
}

/* Hide children in the ghost card to make it look like a clean empty slot */
.ghost-card > * {
    visibility: hidden;
}
</style>