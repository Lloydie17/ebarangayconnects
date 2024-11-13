import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { ProjectService, AccountService, AlertService } from '@app/_services';

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
        private projectService: ProjectService,
        private accountService: AccountService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['projectId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            projectName: ['', Validators.required], 
            projectDescription: ['', Validators.required],
            projectBudget: ['', Validators.required],
            projectRemarks: [''],
            projectStatus: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
        });

        if (!this.isAddMode) {
            this.projectService.getById(this.id)
                .pipe(first())
                .subscribe(project => this.form.patchValue(project));
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
            this.createProject();
        } else {
            this.updateProject();
        }
    }

    private createProject() {
        const accountId = this.accountService.accountValue.id;

        const params = { ...this.form.value, accountId };

        this.projectService.createProject(params)
        .pipe(first())
        .subscribe({
            next: () => {
                this.alertService.success('Project created successfully', { keepAfterRouteChange: true });
                this.router.navigate(['../'], { relativeTo: this.route });
            },
            error: error => {
                this.alertService.error(error);
                this.loading = false;
            }
        });
    }

    private updateProject() {
        this.loading = true;

        this.projectService.updateProject(this.id, this.form.value)
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
