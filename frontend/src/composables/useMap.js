// src/composables/useMap.js
import { shallowRef, ref } from 'vue';
import { Loader } from '@googlemaps/js-api-loader';

import { useFormStore } from '@/store/formStore.js';


const latitudeDetails = 14.594270431746567
const longitudeDetails = 120.97049039300487

export const mapInstance = shallowRef(null); 
let marker;

// --- 1. Map Constants ---
const apiKey = 'AIzaSyCV_3vXLEc5DpJvbLTwp3WC2sJZKoIOlx8';
const mapID = 'f05a502b901471fad1c35f6a';
const center = { lat: 14.59020041134482, lng: 120.97552261305935 };
const zoom = 15;
const mapBounds = {
    north: 14.596820035257135,
    south: 14.58379713784577,
    east: 120.98774350593443,
    west: 120.96256299077379
};

let markersArray = [];
let Marker;
let PinElement;

const originalCenter = ref(null);
export const isPanned = ref(false);
export const mapsLibrary = shallowRef(null);
const stopZoom = 18;
const originalZoom = ref(null);
export const activeStopTitle = ref(null);

let resolveMapReady;
export const mapReady = new Promise(resolve => {
    resolveMapReady = resolve;
});

export async function initMap(mapElementId) {
    const formStore = useFormStore();

    const loader = new Loader({
        apiKey: apiKey,
        version: 'weekly',
        mapIds: [mapID],
        libraries: ['geometry']
    });

    try {
        const [mapsLib, markerLib, geometryLib] = await Promise.all([
            loader.importLibrary('maps'),
            loader.importLibrary('marker'),
            loader.importLibrary('geometry')
        ]);

        const mapOptions = {
            center: center,
            zoom: zoom,
            disableDefaultUI: true,
            gestureHandling: "greedy",
            mapId: mapID,
            restriction: {
                latLngBounds: mapBounds,
                strictBounds: false,
            }
        };

        const Map = mapsLib.Map;
        const map = new Map(document.getElementById(mapElementId), mapOptions);
        mapInstance.value = map; 
        mapsLibrary.value = mapsLib;

        originalCenter.value = map.getCenter();
        originalZoom.value = map.getZoom();

        Marker = markerLib.AdvancedMarkerElement;
        PinElement = markerLib.PinElement; 


        const polylineString = formStore.tripData.polyline
        const polylinePath = google.maps.geometry.encoding.decodePath(polylineString);
        const routeLine = new google.maps.Polyline({
            path: polylinePath,
            geodesic: true,
            strokeColor: "#9954DD",
            strokeOpacity: 1.0,
            strokeWeight: 6,
        });

        routeLine.setMap(map);
        resolveMapReady(true); 
    } catch (e) {
        console.error('Error loading Google Maps API:', e);
    }
}

/**
 * Updates or creates markers based on an array of coordinates.
 * This function clears existing markers and redraws the new set.
 * * @param {Array<Object>} locationsArray - Array of {lat, lng} objects.
 */
export function newMarker(locationsArray) {
    if (!mapInstance.value) {
        mapReady.then(() => newMarker(locationsArray));
        return;
    }

    markersArray.forEach(marker => marker.map = null);
    markersArray = [];

    const positionRegistry = {}; 

    locationsArray.forEach((data, index) => {
        
        let placeName = "Unknown Location";
        if (data.title) placeName = data.title;
        else if (data.places?.displayName?.text) placeName = data.places.displayName.text;
        else if (data.name) placeName = data.name;

        const rawLat = data.lat || (data.location?.latitude) || (data.places?.location?.latitude);
        const rawLng = data.lng || (data.location?.longitude) || (data.places?.location?.longitude);

        if (!rawLat || !rawLng) return;

       
        const locKey = `${rawLat.toFixed(5)}_${rawLng.toFixed(5)}`;
        let finalLat = rawLat;
        let finalLng = rawLng;

        if (positionRegistry[locKey]) {
            const count = positionRegistry[locKey];
            const offset = 0.00015 * count; 
            finalLat = rawLat + offset; 
            finalLng = rawLng + offset; 
            positionRegistry[locKey]++;
        } else {
            positionRegistry[locKey] = 1;
        }

        
        let color;
        if (index === 0) color = '#7025BB'; 
        else if (index === locationsArray.length - 1) color = '#7025BB'; 
        else color = '#AD76E4'; 

        const pinElement = new google.maps.marker.PinElement({
            background: color,
            borderColor: '#FFFFFF',
            glyphColor: '#FFFFFF',
            scale: 1.0 
        });

       

        const labelElement = document.createElement("div");
        labelElement.textContent = `${index + 1}. ${placeName}`;
        
        
        labelElement.style.position = "absolute"; 
        labelElement.style.left = "100%";         
        labelElement.style.top = "50%";           
        labelElement.style.transform = "translateY(-50%)"; 
        labelElement.style.marginLeft = "8px"; 
        
       
        labelElement.style.backgroundColor = "white";
        labelElement.style.color = "#333";
        labelElement.style.padding = "4px 8px";
        labelElement.style.borderRadius = "4px";
        labelElement.style.fontSize = "10px";
        labelElement.style.fontWeight = "600";
        labelElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.3)";
        labelElement.style.whiteSpace = "nowrap";

        
        const container = document.createElement("div");
        container.style.position = "relative";
        container.style.cursor = "pointer";
        
        container.style.transform = "translateY(-20%)"; 

        container.appendChild(pinElement.element);
        container.appendChild(labelElement);

        const marker = new google.maps.marker.AdvancedMarkerElement({
            position: { lat: finalLat, lng: finalLng },
            map: mapInstance.value,
            content: container,
            title: placeName,
            zIndex: index + 10 
        });

        markersArray.push(marker);
    })
}

export function clearMapInstance() {
    markersArray.forEach(marker => {
        marker.map = null; 
    });
    markersArray = [];

    if (mapInstance.value) {
        mapInstance.value = null; 
    }
}

export async function togglePan(targetLat, targetLng, stopTitle) {
    await mapReady; 

    if (!mapInstance.value || !originalCenter.value || originalZoom === null) {
        console.warn('Map or original state missing.');
        return;
    }
    
    let newCenter;
    let newZoom;
    if (isPanned.value) {
        newCenter = originalCenter.value;
        newZoom = originalZoom.value;
        
        activeStopTitle.value = null;
        isPanned.value = false; 
        console.log(newZoom)
    } 
    else {
        newCenter = new google.maps.LatLng(targetLat, targetLng); 
        newZoom = stopZoom; 

        activeStopTitle.value = stopTitle;
        isPanned.value = true;
        console.log(activeStopTitle)
        console.log(newCenter)
    }
        mapInstance.value.setZoom(newZoom); 
        mapInstance.value.panTo(newCenter); 
    
}