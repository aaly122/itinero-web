<script setup>
import Tabs from 'primevue/tabs';
import TabList from 'primevue/tablist';
import Tab from 'primevue/tab';
import TabPanels from 'primevue/tabpanels';
import TabPanel from 'primevue/tabpanel';
import InputText from 'primevue/inputtext';
import ToggleSwitch from 'primevue/toggleswitch';
import Button from 'primevue/button';
import Chip from 'primevue/chip';

import { supabase } from '@/lib/supabase'
import { ref, onMounted, computed } from 'vue';
import { useToast } from 'primevue/usetoast';
import { useUserStore } from '@/store/userStore';
import { useFormStore } from '@/store/formStore'; // Add this import

const savedItineraries = ref([]);

const zero = false;

// Initialize user store
const userStore = useUserStore();
const formStore = useFormStore(); // Initialize form store

async function fetchSavedItineraries() {
    // Ensure user is logged in before fetching
    if (!userStore.profile) {
        console.warn('User profile not loaded, cannot fetch saved itineraries.');
        savedItineraries.value = [];
        return;
    }

    const { data, error } = await supabase
      .from('itineraries')
      .select('*, itinerary_stops(*)')
      .eq('owner_id', userStore.profile.id); // <--- THIS IS THE CRITICAL CHANGE
    
    if (error) {
        console.error('Error fetching itineraries:', error)
    } else {
        savedItineraries.value = data
        console.log("Saved: ",savedItineraries.value);
    }
}

onMounted(() => {
    fetchSavedItineraries();
});

let visible = ref(false);

const selectedItinerary = ref(null);

// Add reactive state for editing
const saving = ref(false);
const newTag = ref('');
const tags = ref([]);

// Initialize toast for user feedback
const toast = useToast(); 

const isItinerariesEmpty = computed(() => savedItineraries.value.length === 0);
let stopsArray = ref(null)
let isPublic = ref(null)

const selectItinerary = (itinerary) => {
    selectedItinerary.value = itinerary;
    visible.value = true;

    // Access stops from full_trip_data.stops
    stopsArray.value = selectedItinerary.value.itinerary_stops?.[0]?.full_trip_data?.stops;
    
    // isPublic remains directly on itinerary table, not in full_trip_data
    isPublic.value = selectedItinerary.value.is_public;
    // Ensure tags is always an array of strings
    let tagString = selectedItinerary.value.tags;
    
    // Remove outer curly braces or square brackets
    tagString = tagString.replace(/^{|}$|^\[|\]$/g, ''); 
    
    // Split by comma and remove quotes for JSON-like string arrays
    tags.value = tagString ? tagString.split(',').map(tag => tag.trim().replace(/^"|"$/g, '')) : [];
    
    console.log('selected:', stopsArray.value);
    console.log('public', isPublic.value);
    console.log('tags:', tags.value); // This log will be crucial to verify the fix
};

const openItineraryInViewer = () => {
  if (selectedItinerary.value) {
    formStore.loadItineraryForEditing(selectedItinerary.value);
    visible.value = false; // Close the AccountsTabs dialog
  } else {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No itinerary selected to open in viewer.', life: 3000 });
  }
};

const addTag = () => {
  const tagValue = newTag.value.trim();
  if (tagValue && !tags.value.includes(tagValue) && !tagValue.includes(' ')) { // Ensure single word
    tags.value.push(tagValue);
    newTag.value = '';
  }
};

const removeTag = (tagToRemove) => {
  const index = tags.value.indexOf(tagToRemove);
  if (index > -1) {
    tags.value.splice(index, 1);
  }
};

const deleteItinerary = async () => {
  if (!selectedItinerary.value || !selectedItinerary.value.id) {
    toast.add({ severity: 'error', summary: 'Error', detail: 'No itinerary selected for deletion.', life: 3000 });
    return;
  }

  if (!confirm(`Are you sure you want to delete "${selectedItinerary.value.title}"? This action cannot be undone.`)) {
    return;
  }

  saving.value = true; // Use saving state to disable buttons during deletion
  try {
    const itineraryIdToDelete = selectedItinerary.value.id;

    // 1. Delete associated itinerary stops
    const { error: deleteStopsError } = await supabase
      .from('itinerary_stops')
      .delete()
      .eq('itinerary_id', itineraryIdToDelete);

    if (deleteStopsError) throw deleteStopsError;

    // 2. Delete the itinerary itself
    const { error: deleteItineraryError } = await supabase
      .from('itineraries')
      .delete()
      .eq('id', itineraryIdToDelete);

    if (deleteItineraryError) throw deleteItineraryError;

    toast.add({ severity: 'success', summary: 'Success', detail: 'Itinerary deleted successfully!', life: 3000 });
    await fetchSavedItineraries(); // Refresh the list
    visible.value = false; // Close dialog
  } catch (error) {
    console.error('Error deleting itinerary:', error);
    toast.add({ severity: 'error', summary: 'Error', detail: `Failed to delete itinerary: ${error.message || error}`, life: 3000 });
  } finally {
    saving.value = false;
  }
};

// Add save changes function
const saveChanges = async () => {
  if (!selectedItinerary.value) return;

  saving.value = true;
  try {
    const { error } = await supabase
      .from('itineraries')
      .update({
        title: selectedItinerary.value.title,
        description: selectedItinerary.value.description,
        is_public: isPublic.value,
        tags: tags.value, // Save tags array
        updated_at: new Date().toISOString()
      })
      .eq('id', selectedItinerary.value.id);

    if (error) throw error;

    // Refresh the itineraries list to show updated data
    await fetchSavedItineraries();

    // Close dialog
    visible.value = false;

    // Show success message
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Itinerary updated successfully',
      life: 3000
    });
  } catch (error) {
    console.error('Error updating itinerary:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: 'Failed to update itinerary',
      life: 3000
    });
  } finally {
    saving.value = false;
  }
};



import Dialog from 'primevue/dialog';
import { length } from '@vee-validate/rules';

</script>
<template>
    <section class="min-h-full md:h-full w-full">
        <Tabs value="0" >
            <TabList>
                <Tab value="0">Saved</Tab>
                <Tab value="1">Settings</Tab>
            </TabList>
            <TabPanels>
                <TabPanel value="0">
                    <div v-if="isItinerariesEmpty" class="flex justify-center items-center h-full">
                        <p class="text-slate-500 text-xl">Your saved itineraries would end up here</p>
                    </div>

                    <div v-else class="h-full w-full">
                        <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div v-for="entry in savedItineraries" :key="savedItineraries.id" class="card bg-white cursor-pointer hover:bg-slate-100 active:scale-98 animate-enter" style="--delay:0s" @click="selectItinerary(entry)">
                                <h1 class="text-xl text-slate-800 font-bold">{{ entry.title }}</h1>
                                <p class="mt-10 text-slate-600">{{ entry.description }}</p>
                                <p class="text-xs text-slate-500 pt-5"> Created: {{ new Date(entry.created_at).toLocaleDateString() }}</p>
                            </div>
                        </div>
                    </div>

                </TabPanel>
                <TabPanel value="1">

                </TabPanel>
            </TabPanels>
        </Tabs>

        <Dialog 
    v-model:visible="visible" 
    modal 
    :header="selectedItinerary?.title || 'Edit Itinerary'" 
    :style="{ width: '60rem'}" 
    :breakpoints="{ '960px': '75vw', '641px': '100vw' }"
    class="card gradient-5 h-full md:h-150"
>
    <div class="h-full flex flex-col justify-between">
        
        <div class="flex-1 overflow-y-auto md:overflow-visible p-1">
            <span class="text-surface-500 dark:text-surface-400 block mb-8">
                Update your itinerary details.
            </span>
            
            <div class="flex flex-col md:flex-row gap-6">
                
                <div class="w-full md:w-1/2">
                    
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                        <label for="title" class="font-semibold w-24">Title</label>
                        <InputText id="title" autocomplete="off" v-model="selectedItinerary.title" class="field-input w-full" :disabled="saving"/>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
                        <label for="description" class="font-semibold w-24">Description</label>
                        <InputText id="description" autocomplete="off" v-model="selectedItinerary.description" class="field-input w-full" :disabled="saving"/>
                    </div>
                    
                    <div class="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-4 mb-4">
                        <label for="tags" class="font-semibold w-32 sm:pt-2">Tags</label>
                        <div class="flex flex-col gap-2 w-full">
                            <div class="flex w-full">
                                <InputText 
                                    id="newTag" 
                                    v-model="newTag" 
                                    placeholder="Add a tag..." 
                                    class="field-input rounded-r-none! w-full"
                                    @keyup.enter="addTag"
                                    :disabled="saving"
                                />
                                <Button 
                                    icon="pi pi-plus"
                                    @click="addTag" 
                                    :disabled="!newTag.trim() || newTag.includes(' ') || saving"
                                    size="small"
                                    class="interactive-btn-secondary cursor-pointer rounded-l-none! font-extrabold"
                                />
                            </div>
                            <div class="flex flex-wrap gap-1">
                                <Chip 
                                    v-for="tag in tags" 
                                    :key="tag" 
                                    :label="tag" 
                                    removable 
                                    @remove="removeTag(tag)"
                                    class="text-sm bg-white border border-slate-300 rounded-xl"
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex items-center gap-4 mb-8">
                        <label for="isPublic" class="font-semibold w-24">Public</label>
                        <ToggleSwitch id="isPublic" v-model="isPublic" :disabled="saving"/>
                    </div>

                    <div class="mt-4">
                        <p class="text-sm">Created: {{ new Date(selectedItinerary.created_at).toLocaleDateString() }}</p>
                        <p class="text-sm">Total Stops: {{ stopsArray?.length || 0 }}</p>
                    </div>
                </div>

                <div class="w-full md:w-1/2 flex flex-col gap-2">
                    <h1 class="font-bold text-xl">Stops:</h1>
                    <div class="flex flex-col gap-2 max-h-60 md:max-h-[25rem] overflow-y-auto p-1">
                        <div v-for="stop in stopsArray" :key="stop.id" class="card bg-slate-100 w-full p-2">
                            <h1>{{ stop.places.displayName.text }}</h1>
                        </div>
                    </div>
                </div>

            </div>
        </div>    
        
        <div class="flex flex-col-reverse md:flex-row justify-between gap-4 pt-8 pb-2">
            
            <div class="flex flex-col md:flex-row gap-2 w-full md:w-auto">
                <Button type="button" label="Edit in Viewer" severity="secondary" @click="visible = false" class="interactive-btn-secondary w-full md:w-auto" :disabled="saving"></Button>
                <div class="flex gap-2">
                    <Button type="button" label="Delete" severity="secondary" @click="deleteItinerary()" class="interactive-btn-secondary w-full md:w-25" :disabled="saving"></Button>
                    <Button type="button" label="Open" severity="secondary" @click="openItineraryInViewer()" class="interactive-btn-secondary w-full md:w-25" :disabled="saving"></Button>
                </div>
            </div>

            <div class="flex gap-2 w-full md:w-auto">
                <Button type="button" label="Cancel" severity="secondary" @click="visible = false" class="interactive-btn-secondary w-full md:w-25" :disabled="saving"></Button>
                <Button type="button" label="Save" @click="saveChanges" class="interactive-btn-primary w-full md:w-25" :loading="saving" :disabled="!selectedItinerary?.title?.trim()"></Button>
            </div>
        </div>
    </div>

</Dialog>
    </section>
</template>