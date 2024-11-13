import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { first } from 'rxjs/operators';

import { RequestService, ServicesService, AlertService, NotificationService } from '@app/_services';

@Component({ templateUrl: 'certificate.component.html'})

export class CertificateComponent implements OnInit {
    form: FormGroup;
    id: string;
    isRequestMode: boolean;
    loading = false;
    submitted = false;
    service: any = {};
    servicesFee: string;
    servicesName: string;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private requestService: RequestService,
        private servicesService: ServicesService,
        private alertService: AlertService,
        private notificationService: NotificationService,
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

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;

        this.requestService.createRequest(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Please proceed to the barangay 3rd floor office for the payment.', { keepAfterRouteChange: true });
                    setTimeout(() => {
                        this.router.navigate(['/'], { relativeTo: this.route });
                    }, 2000)
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}