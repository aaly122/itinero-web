import { defineStore } from 'pinia';
import axios from 'axios'
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
      stops: null,
      distances: [],
      durations: [],
      polyline: null,
      totalDistance: null,
      totalDuration: null
    }

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

      this.loading = true;
      this.error = null;

      const API_ENDPOINT = `${BASE_URL}/api`;
      const response = await axios.post(API_ENDPOINT, this.tripData);
      this.SuccessMessage = response.data.message;
      console.log('Search Results: ', response.data.search_results);
      console.log('Other Places:', response.data.other_results);
      console.log('Distance Matrix:', response.data.distance_matrix)
      console.log("Distance: ", response.data.distances)
      console.log("Durations: ", response.data.durations)
      console.log("Path: ", response.data.path)
      console.log("Total Distance: ", response.data.total_distance)
      console.log("Total Time: ", response.data.total_time)
      console.log("Final_schedule", response.data.final_schedule)
      console.log("Time for activities", response.data.time_for_activities)
      console.log("Segment Duration: ", response.data.segments.durations)
      console.log("Segment Distance", response.data.segments.distances)
      console.log("Polyline: ", response.data.polyline)
      this.tripData.stops = response.data.final_schedule
      this.tripData.distances = response.data.segments.distances
      this.tripData.durations = response.data.segments.durations
      this.tripData.polyline = response.data.polyline
      this.tripData.totalDistance = response.data.total_distance
      this.tripData.totalDuration = response.data.total_time
      
      routerInstance.push('/Dashboard');
        
      // } catch (error) {
      //   this.errorthis.error = error.response.data.error || 'Network error.';
      //   console.error('Error details:', error);
      // } finally {
      //   this.loading = false;
      // }
    },
    async regenerateItinerary(){
      const API_ENDPOINT = `${BASE_URL}/api`;
      const response = await axios.post(API_ENDPOINT, this.tripData);
      this.tripData.stops = response.data.final_schedule
      this.tripData.distances = response.data.segments.distances
      this.tripData.durations = response.data.segments.durations
      this.tripData.polyline = response.data.polyline
      this.tripData.totalDistance = response.data.total_distance
      this.tripData.totalDuration = response.data.total_time
      routerInstance.push('/Dashboard');

    },
    resetState () {
      this.tripData.$reset();
    }
  } 
});
