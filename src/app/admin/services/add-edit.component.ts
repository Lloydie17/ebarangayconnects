import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { ServicesService, AlertService } from '@app/_services';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    services: any = {};

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private servicesService: ServicesService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['servicesId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            servicesName: ['', Validators.required], 
            servicesDetails: ['', Validators.required],
            servicesFee: ['', Validators.required],
            servicesType: ['', Validators.required],
        });

        if (!this.isAddMode) {
            this.servicesService.getById(this.id)
                .pipe(first())
                .subscribe(services => this.form.patchValue(services));
        }
    }
    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        console.log(this.form.value);

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }

        this.loading = true;
        if (this.isAddMode) {
            this.createServices();
        } else {
            this.updateServices();
        }
    }

    private createServices() {
            this.servicesService.createServices(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Services created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateServices() {
        this.loading = true;

        this.servicesService.updateServices(this.id, this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Updated successful', { keepAfterRouteChange: true });
                    this.router.navigate(['../../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}
