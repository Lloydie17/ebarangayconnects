import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { HouseholdService, ResidentService, AlertService } from '@app/_services';
import { Household } from '@app/_models';
import * as L from 'leaflet';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    households: any[];
    residents: any[];
    displayedHouseholds: Household[] = [];
    searchHousehold: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'householdOwner';
    sortOrder: 'asc' | 'desc' = 'asc';

    map: L.Map;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    marker: L.Marker;
    bounceInterval: any; 

    constructor(
        private householdService: HouseholdService,
        private residentService: ResidentService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.residentService.getAll()
            .pipe(first())
            .subscribe(residents => this.residents = residents)

        this.householdService.getAll()
            .pipe(first())
            .subscribe(households => {
                this.households = households;
                this.totalEntries = this.households.length;
                this.updateDisplayedHouseholds();

                this.addHouseholdMarkers();
            });

        this.initMap();
    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedHouseholds() {
        const searchTerm = this.searchHousehold.toLowerCase();
        let filteredhouseholds = this.households.filter(household => {
            // Safeguard against null or undefined fields
            const householdOwner = household.householdOwner || '';
            const householdNo = household.householdNo || '';

            // Match against resident fields
            const matchesHousehold = 
                householdOwner.toLowerCase().includes(searchTerm) || 
                householdNo.toString().includes(searchTerm);

            return matchesHousehold;
        });

        filteredhouseholds = this.sortHouseholds(filteredhouseholds);

        this.totalEntries = filteredhouseholds.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedHouseholds = filteredhouseholds.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedHouseholds();
        }
    }

    sortHouseholds(households) {
        return households.sort((a, b) => {
            const valueA = a[this.sortColumn].toLowerCase();
            const valueB = b[this.sortColumn].toLowerCase();

            if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Get total pages
    getTotalPages(): number {
        return Math.ceil(this.totalEntries / this.pageSize);
    }

    // Handle page size change
    onPageSizeChange(event: any) {
        this.pageSize = event.target.value;
        this.currentPage = 1; // Reset sa first page
        this.updateDisplayedHouseholds();
    }

    onSearch() {
        console.log('Search term:', this.searchHousehold);
        this.currentPage = 1;
        this.updateDisplayedHouseholds();
    }

    // Helpers
    getStartIndex(): number {
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalEntries);
    }

    sortBy(column: string, order: 'asc' | 'desc') {
        this.sortColumn = column;
        this.sortOrder = order;
        this.updateDisplayedHouseholds();
    }

    deleteHousehold(householdId: string) {
        const household = this.households.find(hh => hh.householdId === householdId);
        household.isDeleting = true;
        this.householdService.delete(householdId)
            .pipe(first())
            .subscribe(() => {
                this.alertService.success('Household deleted successfully', { keepAfterRouteChange: true });
                this.households = this.households.filter(hh => hh.householdId !== householdId);
                this.totalEntries = this.households.length;
                this.updateDisplayedHouseholds();
            });
    }

    addHouseholdMarkers() {
        this.households.forEach(household => {
            // Ensure latitude and longitude are available for the household
            if (household.householdLat && household.householdLong) {
                const householdLocation = new L.LatLng(household.householdLat, household.householdLong);
                
                // Filter residents that match the current householdId
                const matchingResidents = this.residents.filter(
                    resident => resident.householdId === household.householdId
                );

                // Get the count of matching residents
                const residentsCount = matchingResidents.length;
    
                // Create the popup content
                const popupContent = `
                    <strong>Household No:</strong> ${household.householdNo}<br>
                    <strong>Owner:</strong> ${household.householdOwner}<br>
                    <strong>Household Members:</strong> ${residentsCount}
                `;
    
                // Create a marker with a custom icon and popup for each household
                const marker = L.marker(householdLocation, {
                    icon: L.icon({
                        iconUrl: 'https://firebasestorage.googleapis.com/v0/b/ebarangayconnect-cbd22.appspot.com/o/marker.svg?alt=media&token=2f8b1901-bff0-422c-9adb-850e26734ec6',
                        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                        iconSize: [30, 51],
                        iconAnchor: [12, 41],
                        popupAnchor: [1, -34],
                        shadowSize: [51, 51]
                    })
                }).bindPopup(popupContent)
                  .addTo(this.map); // Add the marker to the map
    
                this.startBouncing(marker);
            }
        });
    }
    
    // MAPS

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

        this.addHouseholdMarkers();
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
