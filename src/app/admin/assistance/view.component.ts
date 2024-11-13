import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { first } from 'rxjs/operators';
import { RequestService, AlertService, NotificationService } from '@app/_services';
import { Request } from '@app/_models';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as L from 'leaflet';

@Component({ templateUrl: 'view.component.html'})
export class ViewComponent implements OnInit {
    id: string;
    request: any;
    isViewMode: boolean;
    submitted = false;
    form: FormGroup;
    map: L.Map;
    initialLatLng: L.LatLng;
    marker: L.Marker;
    userMarker: L.Marker;
    bounceInterval: any;
    barangayLayer: L.GeoJSON;

    constructor(
        private requestService: RequestService,
        private alertService: AlertService,
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['requestId'];
        this.isViewMode = !this.id;

        this.form = this.formBuilder.group({
            requestName: [''],
            requestAddress: [''],
            requestPurpose: [''],
            status: ['', Validators.required]
        });

        if (!this.isViewMode) {
            this.requestService.getById(this.id)
                .pipe(first())
                .subscribe(request => {
                    this.request = request;
                    this.form.patchValue(request);

                    // Initialize the map after the request data is loaded
                    this.initializeMap(request);
                });
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    updateStatus(requestId: string, newStatus: number): void {
        this.requestService.updateStatus(requestId, { status: newStatus }).subscribe({
            next: () => {
                this.alertService.success('Request status updated successfully!');
                this.request.status = newStatus;
                this.router.navigate(['../../'], { relativeTo: this.route });
                this.notificationService.loadRequests();
            },
            error: (error) => {
                console.error('Error updating status:', error);
                this.alertService.error('Failed to update request status.');
            }
        });
    }

    initializeMap(request: any) {
        this.initialLatLng = new L.LatLng(request.requestLat, request.requestLong);
        this.map = L.map('map').setView(this.initialLatLng, 16.4);

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

        streetLayer.addTo(this.map);

        const customIcon = L.icon({
            iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/marker.svg?alt=media&token=2f8b1901-bff0-422c-9adb-850e26734ec6',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [30, 51],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [51, 51]
        });
    
        this.marker = L.marker(this.initialLatLng, { icon: customIcon }).bindPopup(request.requestName).addTo(this.map)
    
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
            "Street View": streetLayer,
            "Satellite View": satelliteLayer,
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