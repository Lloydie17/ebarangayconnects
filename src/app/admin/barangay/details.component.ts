import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { BarangayService } from '@app/_services';
import { Barangay } from '@app/_models';
import * as L from 'leaflet';

@Component({ templateUrl: 'details.component.html' })
export class DetailsComponent implements OnInit {
    barangay: Barangay; // Changed from Barangay[] to Barangay
    form: FormGroup;
    loading = false;
    map: L.Map;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    marker: L.Marker;
    bounceInterval: any; 

    constructor(
        private barangayService: BarangayService,
        private formBuilder: FormBuilder,
    ) { }

    ngOnInit() {
        // Fetch barangay data from the service
        this.barangayService.getAll().subscribe(barangays => {
            // Assuming you only need the first barangay from the array
            this.barangay = barangays[0]; 
            this.initializeForm(); 
            this.initMap();
        });
    }

    initializeForm() {
        this.form = this.formBuilder.group({
            barangayCaptain: [this.barangay.barangayCaptain],
            barangayName: [this.barangay.barangayName],
            barangayHallAddress: [this.barangay.barangayHallAddress || ''],
            barangayContactNum: [this.barangay.barangayContactNum],
            barangayCaptainMessage: [this.barangay.barangayCaptainMessage],
            barangayHistoricalInfo: [this.barangay.barangayHistoricalInfo],
            barangayLat: [this.barangay.barangayLat],
            barangayLong: [this.barangay.barangayLong],
            barangayVision: [this.barangay.barangayVision],
            barangayMission: [this.barangay.barangayMission],
            barangayCaptainImg: [this.barangay.barangayCaptainImg || '']
        });
    }

    initMap() {
        const lat = Number(this.barangay.barangayLat);
        const long = Number(this.barangay.barangayLong);

        this.map = L.map('map').setView([lat, long], 17);

        // Street view layer
        const streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        // Satellite view layer
        const satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
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
        streetLayer.addTo(this.map);

        const customIcon = L.icon({
            iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/marker.svg?alt=media&token=2f8b1901-bff0-422c-9adb-850e26734ec6',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [30, 51],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [51, 51]
        });

        this.marker = L.marker([lat, long], { icon: customIcon }).addTo(this.map)

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
            "Street View": streetLayer,
            "Satellite View": satelliteLayer,
            "Standard": standardLayer,
            "Dark Mode": darkLayer,
            "Light Mode": lightLayer
        };
        L.control.layers(baseLayers).addTo(this.map);
    }

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

    getUserLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                const userLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
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
}
