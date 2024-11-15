import { Component, OnInit } from '@angular/core';
import { ResidentService } from '@app/_services';

import 'leaflet';
import 'leaflet-routing-machine';

declare let L;

@Component({
  templateUrl: 'track.component.html',
  styleUrls: ['track.component.css']
})
export class TrackComponent implements OnInit {
    residentName: string;
    displayedResidentName: string; // Variable to hold the name to be displayed
    residentLocation: any; // Object to hold latitude and longitude
    showResidentName: boolean = false; // Control the visibility of the resident name label
    map: L.Map;
    marker: L.Marker;
    satelliteLayer: L.TileLayer;
    streetLayer: L.TileLayer;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    initialLatLng: L.LatLng;
    bounceInterval: any; 
    routingControl: any;
    currentUserLatLng: L.LatLng;
    residentLoc: L.LatLng;

    constructor(private residentService: ResidentService) { }

    ngOnInit() {
        this.initMap();
    }

    initMap() {
        this.initialLatLng = new L.LatLng(10.292033208062072, 123.89620623806424);
        this.map = L.map('map').setView(this.initialLatLng, 16.4);

        // Street view layer
        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        // Satellite view layer
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri'
        });

        const standardLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CartoDB'
        });

        const darkLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CartoDB'
        });

        const lightLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
            attribution: '© OpenStreetMap, © CartoDB'
        });

        // Add the street view layer by default
        this.streetLayer.addTo(this.map);

        const customIcon = L.icon({
            iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/marker.svg?alt=media&token=2f8b1901-bff0-422c-9adb-850e26734ec6',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [30, 51],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [51, 51]
        });

        this.marker = L.marker(this.initialLatLng, { icon: customIcon }).bindPopup('Ermita Barangay Hall').addTo(this.map)

        // Start the bouncing effect
        this.startBouncing(this.marker);

        this.barangayLayer = L.geoJSON(null, {
            style: {
                color: 'red',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.1
            }
        }).addTo(this.map);

        fetch('assets/Ermita.geojson')
            .then(response => response.json())
            .then(data => {
                this.barangayLayer.addData(data);
            });

        // Layer control to switch between street and satellite views
        const baseLayers = {
            "Street View": this.streetLayer,
            "Satellite View": this.satelliteLayer,
            "Standard": standardLayer,
            "Dark Mode": darkLayer,
            "Light Mode": lightLayer
        };
        L.control.layers(baseLayers).addTo(this.map);
    }

    // Function to make the marker bounce
    startBouncing(marker: L.Marker) {
        let bounceHeight = 5; // Height of the bounce in meters
        let bounceStep = 0.0000025; // How much the marker moves per step
        let goingUp = true; // To control the direction of movement

        const originalLatLng = marker.getLatLng(); // Store the original position of the marker

        // Repeatedly move the marker up and down
        this.bounceInterval = setInterval(() => {
            let currentLatLng = marker.getLatLng();
            let newLat = currentLatLng.lat;

            // Check if the marker is going up or down
            if (goingUp) {
                newLat += bounceStep;
                if (newLat >= originalLatLng.lat + bounceHeight / 100000) {
                    goingUp = false; // Start going down when the bounce height is reached
                }
            } else {
                newLat -= bounceStep;
                if (newLat <= originalLatLng.lat) {
                    goingUp = true; // Start going up when it reaches the original position
                }
            }

            // Update the marker's position
            marker.setLatLng([newLat, originalLatLng.lng]);
        }, 20); // Controls the speed of the bounce (20ms interval)
    }

    stopBouncing() {
        // Stop the bouncing animation by clearing the interval
        if (this.bounceInterval) {
            clearInterval(this.bounceInterval);
        }
    }

    searchResident() {
        // First filter the residents based on status (only approved ones)
        this.residentService.getAll().subscribe((residents: any[]) => {
            const approvedResidents = residents.filter(resident => resident.status && resident.dump);
            
            // Now check if the residentName exists in the approved residents list
            const resident = approvedResidents.find(r => r.fullName.toLowerCase() === this.residentName.toLowerCase());
    
            if (resident) {
                this.residentService.getResidentLocation(resident.fullName)
                    .subscribe((data: any) => {
                        console.log("Response from API:", data); 
                        this.residentLocation = data;
                        this.displayedResidentName = this.residentLocation.fullName;
                        this.showResidentName = true;
                        this.updateMap(this.residentLocation.latitude, this.residentLocation.longitude, this.residentLocation.fullName);
                        this.residentLoc = this.residentLocation.latitude, this.residentLocation.longitude, this.residentLocation.fullName;
                        
                        // Call getRouteToLocation using user's current location and resident's location
                        if (this.currentUserLatLng) {
                            this.getRouteToLocation(this.currentUserLatLng.lat, this.currentUserLatLng.lng, this.residentLocation.latitude, this.residentLocation.longitude);
                        } else {
                            this.getRouteToLocation(this.initialLatLng.lat, this.initialLatLng.lng, this.residentLocation.latitude, this.residentLocation.longitude);
                        }
                    }, error => {
                        console.log(error);
                        this.showResidentName = false;
                    });
            } else {
                console.log('Resident not found or not approved');
                this.showResidentName = false;
            }
        }, error => {
            console.log('Error fetching residents:', error);
            this.showResidentName = false;
        });
    }
    

    updateMap(latitude: number, longitude: number, fullName: string) {
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        // Stop the bouncing effect before updating the position
        this.stopBouncing();

        // Update the marker position and content
        this.map.setView([latitude, longitude], 20);
        this.marker.setLatLng([latitude, longitude]);
        this.marker.setPopupContent(fullName).openPopup();

        this.startBouncing(this.marker);
    }

    getUserLocation() {
        if (navigator.geolocation) {
            // Use watchPosition to continuously track user's location
            navigator.geolocation.watchPosition(position => {
                const userLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
                this.currentUserLatLng = userLatLng; // Store the updated user's current location
    
                this.stopBouncing(); // Stop bouncing to reset it
    
                // Update userMarker's position if it already exists, else create a new marker
                if (this.userMarker) {
                    this.userMarker.setLatLng(userLatLng); // Update marker's position
                } else {
                    this.userMarker = L.marker(userLatLng, {
                        icon: L.icon({
                            iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/userLocation.svg?alt=media&token=97181746-37fb-4813-9382-7dc7bfe0cf58',
                            iconSize: [25, 25],
                            iconAnchor: [12, 12],
                            popupAnchor: [0, -12],
                        })
                    }).bindPopup('Your Location').addTo(this.map);
                }
    
                // Restart the bouncing effect for the new marker position
                this.startBouncing(this.userMarker);
    
                let destinationLatLng;
                if (this.residentLocation) {
                    destinationLatLng = L.latLng(this.residentLocation.latitude, this.residentLocation.longitude);
                } else {
                    destinationLatLng = this.initialLatLng;
                }
    
                // Get the route from user's current location to the destination
                this.getRouteToLocation(userLatLng.lat, userLatLng.lng, destinationLatLng.lat, destinationLatLng.lng);
    
                // Center the map to the user's current location
                this.map.setView(userLatLng, 20);
            }, error => {
                console.error("Error getting user's location:", error);
            }, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        } else {
            console.error("Geolocation is not supported by this browser.");
        }
    }    

    getRouteToLocation(startLat: number, startLng: number, endLat: number, endLng: number) {
        if (this.routingControl) {
            this.map.removeControl(this.routingControl);
        }

        this.routingControl = L.Routing.control({
            waypoints: [
                L.latLng(startLat, startLng), // Start from current user location
                L.latLng(endLat, endLng)      // End at resident's location
            ],
            routeWhileDragging: true,
            createMarker: () => null, // Prevents markers from being created
            show: false, // Hides the route summary
            addWaypoints: false, // Disables interactive waypoint adding
            lineOptions: {
                styles: [{ color: '#6497b1', weight: 5, opacity: 0.7 }],
                addWaypoints: false // Disables waypoint handles on the route line
            },
            formatter: new L.Routing.Formatter({
                language: 'en',
                units: 'metric'
            }),
            showAlternatives: false, // Hides alternative routes
            fitSelectedRoutes: true, // Ensures the route is shown on the map without zoom issues
            draggableWaypoints: false, // Prevents waypoints from being draggable
        }).addTo(this.map);
    }
}
