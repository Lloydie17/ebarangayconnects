import { Component } from '@angular/core';
import { first } from 'rxjs/operators';
import { AccountService, ServicesService, BarangayService } from '@app/_services';
import { Router } from '@angular/router';
import { Services, ServicesType, Barangay } from '@app/_models';

import * as L from 'leaflet';

@Component({ templateUrl: 'home.component.html'})

export class HomeComponent {
    account = this.accountService.accountValue;
    services: any[];
    barangay: any[];
    barangay2: Barangay;
    map: L.Map;
    marker: L.Marker;
    satelliteLayer: L.TileLayer;
    streetLayer: L.TileLayer;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    initialLatLng: L.LatLng;
    bounceInterval: any;

    constructor(
        private accountService: AccountService,
        private servicesService: ServicesService,
        private barangayService: BarangayService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.servicesService.getAll()
            .pipe(first())
            .subscribe(services => this.services = services)

        this.barangayService.getAll()
            .pipe(first())
            .subscribe(barangay => this.barangay = barangay)

        this.barangayService.getAll().subscribe(barangays => {
            // Assuming you only need the first barangay from the array
            this.barangay2 = barangays[0]; 
            this.initMap();
        });

        this.initMap();
    }

    proceedToRequest(service: any) {
        const serviceType = service.servicesType;
    
        if (serviceType === ServicesType.Certificate) {
            this.router.navigate([`/request/certificate/${service.servicesId}`]);
        } else if (serviceType === ServicesType.Permit) {
            this.router.navigate([`/request/permit/${service.servicesId}`]);
        } else if (serviceType === ServicesType.Emergency) {
            this.router.navigate([`/request/emergency/${service.servicesId}`]);
        } else {
            this.router.navigate([`/`]);
        }
    }

    initMap() {
        const lat = Number(this.barangay2.barangayLat);
        const long = Number(this.barangay2.barangayLong);

        this.initialLatLng = new L.LatLng(lat, long);
        this.map = L.map('map').setView(this.initialLatLng, 16.4);

         // Street view layer
         this.streetLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        });

        // Satellite view layer
        this.satelliteLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles © Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
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

        const icon = L.icon({
            iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/marker.svg?alt=media&token=2f8b1901-bff0-422c-9adb-850e26734ec6',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41], // size of the icon
            iconAnchor: [12, 41], // point of the icon which will correspond to marker's location
            popupAnchor: [1, -34], // point from which the popup should open relative to the iconAnchor
            shadowSize: [41, 41] // size of the shadow
        });

        this.marker = L.marker(this.initialLatLng, { icon }).bindPopup('Ermita Barangay Hall').addTo(this.map)

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
}