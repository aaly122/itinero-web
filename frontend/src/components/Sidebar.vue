<script setup>
    import { ref } from 'vue';
    import Chip from 'primevue/chip';
    import Button from 'primevue/button';
    import { useRouter } from 'vue-router';
    const router = useRouter();
    
    import { useFormStore } from '@/store/formStore.js';
    import { useUserStore } from '@/store/userStore.js';
    
    import { togglePan, isPanned, activeStopTitle } from '@/composables/useMap';
    
    const userStore = useUserStore();
    const isLoggedIn = userStore.hasProfile;
    
    const formStore = useFormStore();
    const destinationsArray = formStore.tripData.stops
    const durations = formStore.tripData.durations
    const distances = formStore.tripData.distances
    const totalDurationData = formStore.tripData.totalDuration
    const totalDuration = Math.ceil(totalDurationData / 60)
    
    const totalDistanceData = formStore.tripData.totalDistance
    const totalDistance = Number(totalDistanceData / 1000).toFixed(1)
    const stops = []
    
    destinationsArray.forEach((place, index) => {
        const stop = {
            tag: place.interestType,
            title: place.places.displayName.text,
            address: place.places.formattedAddress,
            distance: distances[index],
            duration: durations[index],
            lat: place.places.location.latitude,
            lng: place.places.location.longitude,
            arrivalTime: place.arrival_time,
            departureTime: place.leave_time
        }
        stops.push(stop)
    })
    
    const regenerateItinerary = () => {
        router.push('/Loading');
        formStore.regenerateItinerary();
    }
    
    async function saveItinerary() {
        const result = await formStore.saveTripPlan();
    
        if (result.success) {
            console.log('Successfully saved')
        } else {
            alert(`Failed to save trip: ${result.error}`);
        }
    }
    </script>
    
    <template>
        <div id="sideBarContainer" class="bg-transparent z-5 p-4 h-full w-full flex flex-col gap-4">
            
            <div class="w-full card flex flex-col bg-white card flex-1 overflow-hidden">
                <div class="flex p-2 gap-2 justify-between shrink-0">
                    <div class="flex items-center font-bold ">Total Metrics</div>
                    <div class="flex gap-2">
                        <Chip class="rounded-full bg-slate-700 text-white font-bold text-sm pr-2 w-25">
                            <i class="material-icons">straighten</i>
                            {{ totalDistance }} km
                        </Chip>
                        <Chip class="rounded-full bg-slate-700 text-white font-bold text-sm w-25">
                            <i class="material-icons">directions_walk</i>
                            {{ totalDuration }} min
                        </Chip>
                    </div>
                </div>
    
                <div id="lowerBox" class="h-full bg-white rounded-xl flex flex-col p-2 gap-2 overflow-y-auto">
                    <div v-for="stop in stops" :key="stop.title" 
                        @click="togglePan(stop.lat, stop.lng, stop.title)"
                        :class="{
                            'card bg-slate-100 w-full rounded-xl shadow-[0_0_10px_rgba(0,0,0,0.2)] p-4 cursor-pointer transition-all ease-in': true,
                            /* CHANGED: Removed 'grid grid-cols-4...' and added Flexbox classes */
                            'flex flex-col gap-2 min-h-[140px]': true, 
                            'border-primary-200': activeStopTitle !== stop.title,
                            'border-primary-400 scale-101 bg-white': activeStopTitle === stop.title
                        }">
                        
                        <div class="flex justify-between items-start w-full">
                            <p class="font-bold text-xl leading-tight pr-2">{{ stop.title }}</p>
                            <div class="p-2 shrink-0 h-10 text-xs bg-slate-200 border-1 border-slate-300 rounded-full flex justify-center items-center">
                                <p class="font-bold text-slate-800">{{ stop.tag.charAt(0).toUpperCase() + stop.tag.slice(1) }}</p>
                            </div>
                        </div>
    
                        <p class="text-slate-700 italic text-md overflow-hidden flex-1">{{stop.address}}</p>
                        
                        <div class="flex justify-between items-end text-slate-600 font-medium w-full mt-1">
                            <div class="flex gap-3">
                                <span class="flex items-center"><i class="pi pi-arrow-down-right mr-1 text-slate-400"></i>{{ stop.arrivalTime }}</span>
                                <span class="flex items-center"><i class="pi pi-arrow-up-right mr-1 text-primary-500"></i>{{ stop.departureTime }}</span>
                            </div>
                            <span v-if="stop.distance" class="text-slate-400 italic text-[10px]">{{ stop.distance }}m away</span>
                        </div>
    
                    </div>
                </div>
            </div>
    
            <div class="w-full shrink-0 flex flex-row justify-between gap-2 mt-auto">
                <Button icon="pi pi-pen-to-square" rounded raised severity="secondary" label="Edit" 
                    class="flex-1 interactive-btn-secondary !text-slate-800" 
                    @click="router.push('/Edit')"/>
                
                <Button icon="pi pi-save" rounded :disabled="!isLoggedIn" raised severity="secondary" 
                    class="flex-1 interactive-btn-secondary !text-slate-800" label="Save" 
                    @click="saveItinerary"/>
                
                <Button icon="pi pi-replay" rounded raised severity="secondary" label="Regenerate" 
                    class="flex-1 interactive-btn-secondary !text-slate-800" 
                    @click="regenerateItinerary"/>
            </div>
    
        </div>
    </template>