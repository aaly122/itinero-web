import { defineStore } from 'pinia';
import { supabase } from '@/lib/supabase';
import { useUserStore } from '@/store/userStore';
import axios from 'axios';
import router, { routerInstance } from '@/router';

const VITE_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const BASE_URL = VITE_API_BASE_URL || '';



export const useFormStore = defineStore('form', {
  state: () => ({
    tripData: {
      startingLocation: null,
      endingLocation: null,
      timeAllotted: null,
      interests: [],
      itineraryStartTime: null,
      rankingPreference: 'DISTANCE', // Default to distance
      stops: null,
      otherResults: null,
      distances: [],
      durations: [],
      polyline: null,
      totalDistance: null,
      totalDuration: null
    },
    loading: false,
    error: null,
    successMessage: null
    

  }),
  getters: {
    startingLocationUppercase() {
      return this.startingLocation.toUpperCase()
    }
  },
  actions: {
    async updateFormData(data) {
      this.tripData.startingLocation = data.startingLocation;
      this.tripData.endingLocation = data.endingLocation;
      this.tripData.timeAllotted = data.timeAllotted;
      this.tripData.interests = data.interests;
      this.tripData.rankingPreference = data.rankingPreference;

      this.loading = true;
      this.error = null;

      const API_ENDPOINT = `${BASE_URL}/api`;
      const response = await axios.post(API_ENDPOINT, this.tripData);
      this.SuccessMessage = response.data.message;

      this.tripData.stops = response.data.final_schedule
      this.tripData.otherResults = response.data.other_results
      this.tripData.distances = response.data.segments.distances
      this.tripData.durations = response.data.segments.durations
      this.tripData.polyline = response.data.polyline
      this.tripData.totalDistance = response.data.total_distance
      this.tripData.totalDuration = response.data.total_time
      
      console.log("otherresults:", response.data.other_results)
      routerInstance.push('/Dashboard');
        
      // } catch (error) {
      //   this.errorthis.error = error.response.data.error || 'Network error.';
      //   console.error('Error details:', error);
      // } finally {
      //   this.loading = false;
      // }
      //       console.log('Search Results: ', response.data.search_results);
      // console.log('Other Places:', response.data.other_results);
      // console.log('Distance Matrix:', response.data.distance_matrix)
      // console.log("Distance: ", response.data.distances)
      // console.log("Durations: ", response.data.durations)
      // console.log("Path: ", response.data.path)
      // console.log("Total Distance: ", response.data.total_distance)
      // console.log("Total Time: ", response.data.total_time)
      // console.log("Final_schedule", response.data.final_schedule)
      // console.log("Time for activities", response.data.time_for_activities)
      // console.log("Segment Duration: ", response.data.segments.durations)
      // console.log("Segment Distance", response.data.segments.distances)
      // console.log("Polyline: ", response.data.polyline)
    },
    async regenerateItinerary(){
      const API_ENDPOINT = `${BASE_URL}/api`;
      const response = await axios.post(API_ENDPOINT, this.tripData);
      console.log("Final_schedule", response.data.final_schedule)
      this.tripData.stops = response.data.final_schedule
      this.tripData.otherResults = response.data.other_results
      this.tripData.distances = response.data.segments.distances
      this.tripData.durations = response.data.segments.durations
      this.tripData.polyline = response.data.polyline
      this.tripData.totalDistance = response.data.total_distance
      this.tripData.totalDuration = response.data.total_time
      console.log(response.data.other_results)

      routerInstance.push('/Dashboard');

    },

    async recalculateItinerary(data) {
      try {
        const API_ENDPOINT = `${BASE_URL}/api/recalculate`
        const response = await axios.post(API_ENDPOINT, data)

        console.log('Recalculation successful:', response.data.message)

        // Update form store with recalculated data (same format as original API)
        this.tripData.stops = response.data.final_schedule
        // Keep existing otherResults - don't update from recalculate response
        this.tripData.distances = response.data.segments.distances
        this.tripData.durations = response.data.segments.durations
        this.tripData.polyline = response.data.polyline
        this.tripData.totalDistance = response.data.total_distance
        this.tripData.totalDuration = response.data.total_time

        router.push('/Dashboard')

      } catch (error) {
        console.error('Error recalculating itinerary:', error)
        console.error('Error response:', error.response?.data)
        console.error('Error status:', error.response?.status)
        const errorMessage = error.response?.data?.error || error.message || 'Unknown error'
        alert(`Error updating itinerary: ${errorMessage}. Please try again.`)
      }
    },
    resetState () {
      this.$reset();
    },

    async saveTripPlan(title = 'New Itinerary', description = null) {
      this.loading = true;
      this.error = null;
    
      try {
        const userStore = useUserStore();
        const ownerId = userStore.profile?.id; 
    
        if (!ownerId) {
          throw new Error("Authentication error: User profile ID is missing.");
        }
    
        // A. INSERT INTO public.itineraries (HEADER)
        const { data: itineraryData, error: itineraryError } = await supabase
          .from('itineraries')
          .insert({
            owner_id: ownerId, 
            title: title, 
            description: description, 
            is_public: false, 
            // Tags and other itinerary-level data can be added here if needed
          })
          .select('id')
          .single();
    
        if (itineraryError) throw itineraryError;
    
        const newItineraryId = itineraryData.id;
    
        // B. INSERT INTO public.itinerary_stops (DETAILS)
        const stopsData = {
          itinerary_id: newItineraryId,
          full_trip_data: this.tripData, // Store the entire tripData object
        };
    
        const { error: stopsError } = await supabase
          .from('itinerary_stops')
          .insert(stopsData);
    
        if (stopsError) throw stopsError;
    
        this.successMessage = "Trip plan successfully saved!";
        return { success: true, itineraryId: newItineraryId };
    
      } catch (error) {
        console.error('Save error:', error);
        this.error = error.message;
        return { success: false, error: error.message };
      } finally {
        this.loading = false;
      }
    },

    async loadItineraryForEditing(itinerary) {
      this.resetState(); // Clear all tripData fields first

      // Repopulate tripData with selected itinerary's full_trip_data
      if (itinerary.itinerary_stops?.[0]?.full_trip_data) {
        // Deep merge or assign to ensure all properties are set
        Object.assign(this.tripData, itinerary.itinerary_stops[0].full_trip_data);
      } else {
        console.warn('Itinerary stops data (full_trip_data) is missing for selected itinerary.');
        // Potentially set some default empty state or show an error
      }
      
      router.push('/Dashboard'); // Navigate to the dashboard
    }
  } 
});
