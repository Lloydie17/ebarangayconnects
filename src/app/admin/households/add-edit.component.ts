import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { HouseholdService, AlertService } from '@app/_services';
import * as L from 'leaflet';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    households: any = {};
    map: L.Map;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    marker: L.Marker;
    bounceInterval: any; 

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private householdService: HouseholdService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['householdId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            householdNo: ['', Validators.required],
            householdOwner: ['', Validators.required],
            householdLat: ['', Validators.required],
            householdLong: ['', Validators.required],
        });

        if (!this.isAddMode) {
            this.householdService.getById(this.id)
                .pipe(first())
                .subscribe(household => this.form.patchValue(household));
        }

        this.initMap();
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        if (this.isAddMode) {
            this.createHousehold();
        } else {
            this.updateHousehold();
        }
    }

    private createHousehold() {
        this.householdService.createHousehold(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Resident created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateHousehold() {
        this.loading = true;

        this.householdService.updateHousehold(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Update successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    initMap() {
        this.map = L.map('map').setView([10.292033208062072, 123.89620623806424], 17);

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

        this.map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
    
            // Set the form controls' values
            this.form.controls['householdLat'].setValue(lat.toString());
            this.form.controls['householdLong'].setValue(lng.toString());
    
            console.log("Clicked coordinates:", lat, lng);
    
            // Remove existing marker if there is one
            if (this.marker) {
                this.map.removeLayer(this.marker);
            }
    
            // Add a new marker at the clicked position using the custom icon
            this.marker = L.marker([lat, lng], { icon: customIcon }).addTo(this.map)

            this.startBouncing(this.marker);
        });

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