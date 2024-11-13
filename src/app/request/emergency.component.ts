import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { first } from 'rxjs/operators';

import * as L from 'leaflet';

import { RequestService, ServicesService, AlertService } from '@app/_services';

@Component({ templateUrl: 'emergency.component.html'})

export class EmergencyComponent implements OnInit {
    form: FormGroup;
    id: string;
    isRequestMode: boolean;
    loading = false;
    submitted = false;
    service: any = {};
    servicesFee: string;
    servicesName: string;
    currentUserLatLng: L.LatLng;
    userMarker: any;
    residentLocation: any;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private requestService: RequestService,
        private servicesService: ServicesService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.id = this.route.snapshot.params['servicesId'];
        this.isRequestMode = !this.id;

        this.form = this.formBuilder.group({
            requestName: ['', Validators.required],
            requestAddress: ['', Validators.required],
            requestPurpose: ['', Validators.required],
            status: [1],
            services: this.formBuilder.array([])
        });

        if (!this.isRequestMode) {
            this.servicesService.getById(this.id)
                .pipe(first())
                .subscribe(service => {
                    this.servicesName = service.servicesName;
                    this.servicesFee = service.servicesFee;

                    const servicesArray = this.form.get('services') as FormArray;
                    servicesArray.push(this.formBuilder.group({
                        servicesId: [service.servicesId, Validators.required],
                        servicesFee: [service.servicesFee, Validators.required],
                    }))
                });
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    get services() {
        return this.form.get('services') as FormArray;
    }

    getUserLocation(): Promise<L.LatLng> {
        return new Promise((resolve, reject) => {
            if (navigator.geolocation) {
                // Request geolocation with high accuracy enabled and adjusted timeout
                navigator.geolocation.getCurrentPosition(position => {
                    const userLatLng = new L.LatLng(position.coords.latitude, position.coords.longitude);
                    this.currentUserLatLng = userLatLng;
                    resolve(userLatLng); // Resolve the location promise
                }, error => {
                    console.error("Error getting user's location:", error);
                    reject(error); // Reject if location not available
                }, {
                    enableHighAccuracy: true,
                    timeout: 30000, // Increased timeout for better accuracy
                    maximumAge: 0
                });
            } else {
                console.error("Geolocation is not supported by this browser.");
                reject('Geolocation not supported'); // Reject if not supported
            }
        });
    }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;

        this.getUserLocation()
            .then((location: L.LatLng) => {
                // Append the user's coordinates to the form values
                const formValues = {
                    ...this.form.value,
                    requestLat: location.lat.toString(),
                    requestLong: location.lng.toString()
                };

                this.requestService.createRequest(formValues)
                    .pipe(first())
                    .subscribe({
                        next: () => {
                            this.alertService.success('Please proceed to the barangay 3rd floor office for the payment.', { keepAfterRouteChange: true });
                            setTimeout(() => {
                                this.router.navigate(['/'], { relativeTo: this.route });
                            }, 2000);
                        },
                        error: error => {
                            this.alertService.error(error);
                            this.loading = false;
                        }
                    });
            })
            .catch((error) => {
                this.alertService.error('Could not retrieve location. Please enable location services.');
                this.loading = false;
            });
    }
}