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
    displayedResidentName: string;
    residentLocation: any; 
    showResidentName: boolean = false; 
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
    profilePicture: string;

    constructor(private residentService: ResidentService) { }

    ngOnInit() {
        this.initMap();
    }

    initMap() {
        this.initialLatLng = new L.LatLng(10.292033208062072, 123.89620623806424);
        this.map = L.map('map').setView(this.initialLatLng, 16.4);

        this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

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

        const baseLayers = {
            "Street View": this.streetLayer,
            "Satellite View": this.satelliteLayer,
            "Standard": standardLayer,
            "Dark Mode": darkLayer,
            "Light Mode": lightLayer
        };
        L.control.layers(baseLayers).addTo(this.map);
    }

    startBouncing(marker: L.Marker) {
        let bounceHeight = 5; 
        let bounceStep = 0.0000025; 
        let goingUp = true; 

        const originalLatLng = marker.getLatLng();

        this.bounceInterval = setInterval(() => {
            let currentLatLng = marker.getLatLng();
            let newLat = currentLatLng.lat;

            if (goingUp) {
                newLat += bounceStep;
                if (newLat >= originalLatLng.lat + bounceHeight / 100000) {
                    goingUp = false; 
                }
            } else {
                newLat -= bounceStep;
                if (newLat <= originalLatLng.lat) {
                    goingUp = true; 
                }
            }

            marker.setLatLng([newLat, originalLatLng.lng]);
        }, 20);
    }

    stopBouncing() {
        if (this.bounceInterval) {
            clearInterval(this.bounceInterval);
        }
    }

    searchResident() {
        this.residentService.getResidentLocation(this.residentName)
            .subscribe((data: any) => {
                console.log("Response from API:", data); 
                this.residentLocation = data;
                this.displayedResidentName = this.residentLocation.fullName;
                this.showResidentName = true;

                // Profile Picture
                this.profilePicture = this.residentLocation.profilePicture;

                this.updateMap(this.residentLocation.latitude, this.residentLocation.longitude, this.residentLocation.fullName, this.profilePicture);
                this.residentLoc = this.residentLocation.latitude, this.residentLocation.longitude, this.residentLocation.fullName;
                
                if (this.currentUserLatLng) {
                    this.getRouteToLocation(this.currentUserLatLng.lat, this.currentUserLatLng.lng, this.residentLocation.latitude, this.residentLocation.longitude);
                } else {
                    this.marker
                    this.getRouteToLocation(this.initialLatLng.lat, this.initialLatLng.lng, this.residentLocation.latitude, this.residentLocation.longitude);
                }

            }, error => {
                console.log(error);
                this.showResidentName = false;
            });
    }

    updateMap(latitude: number, longitude: number, fullName: string, profilePicture: string) {
        console.log("Latitude:", latitude);
        console.log("Longitude:", longitude);

        this.stopBouncing();

        const popupContent = `
        <div>
            <img src="${profilePicture}" alt="${fullName}" style="width: 200px; height: 200px; border-radius:50%;"/>
            <p><b>Resident's Name:</b> ${fullName}</p>
        </div>
    `;

        // Update the marker position and content
        this.map.setView([latitude, longitude], 20);
        this.marker.setLatLng([latitude, longitude]);
        this.marker.setPopupContent(popupContent).openPopup();

        this.startBouncing(this.marker);
    }

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.watchPosition(position => {
                const userLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
                this.currentUserLatLng = userLatLng; 
    
                this.stopBouncing(); 
    
                if (this.userMarker) {
                    this.userMarker.setLatLng(userLatLng);
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
    

                this.startBouncing(this.userMarker);
    
                let destinationLatLng;
                if (this.residentLocation) {
                    destinationLatLng = L.latLng(this.residentLocation.latitude, this.residentLocation.longitude);
                } else {
                    destinationLatLng = this.initialLatLng;
                }

                this.getRouteToLocation(userLatLng.lat, userLatLng.lng, destinationLatLng.lat, destinationLatLng.lng);
    
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
                L.latLng(startLat, startLng), 
                L.latLng(endLat, endLng)      
            ],
            routeWhileDragging: true,
            createMarker: () => null, 
            show: false,
            addWaypoints: false, 
            lineOptions: {
                styles: [{ color: '#6497b1', weight: 5, opacity: 0.7 }],
                addWaypoints: false 
            },
            formatter: new L.Routing.Formatter({
                language: 'en',
                units: 'metric'
            }),
            showAlternatives: false, 
            fitSelectedRoutes: true, 
            draggableWaypoints: false,
        }).addTo(this.map);
    }
}
