import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { SitioService, BarangayService, AlertService } from '@app/_services';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    barangays: any = {};
    sitios: any = {};

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private sitioService: SitioService,
        private barangayService: BarangayService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['sitioId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            barangayId: ['', Validators.required], 
            sitioName: ['', Validators.required],
        });

        if (!this.isAddMode) {
            this.sitioService.getById(this.id)
                .pipe(first())
                .subscribe(sitio => {
                    this.sitios = sitio;
                    this.form.patchValue(sitio);
                });
        }

        this.loadBarangay();
    }

    private loadBarangay() {
        this.barangayService.getAll()
            .pipe(first())
            .subscribe(barangays => {
                this.barangays = barangays;
            });
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
            this.createSitio();
        } else {
            this.updateSitio();
        }
    }

    private createSitio() {
            this.sitioService.createSitio(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Sitio created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateSitio() {
        this.loading = true;

        this.sitioService.updateSitio(this.id, this.form.value)
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
