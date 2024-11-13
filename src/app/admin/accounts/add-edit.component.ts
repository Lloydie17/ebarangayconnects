import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { MustMatch } from '@app/_helpers';
import { Role } from '@app/_models';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    account: any = {};
    Role = Role;
    selectedFile: File | null = null;
    previewUrl: string | ArrayBuffer | null = null;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['id'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            title: [this.account.title, Validators.required],
            firstName: [this.account.firstName, Validators.required],
            middleName: [this.account.middleName || '' ],
            lastName: [this.account.lastName, Validators.required],
            email: [this.account.email, [Validators.required, Validators.email]],
            civilStatus: [this.account.civilStatus, Validators.required],
            gender: [this.account.gender, Validators.required],
            birthDate: [this.account.birthDate, Validators.required],
            contactNumber: [this.account.contactNumber, [Validators.required, Validators.pattern('^[0-9]{11}$')]],
            role: [this.account.role, Validators.required],
            password: ['', [Validators.minLength(6)]],
            confirmPassword: [''],
            profilePicture: ['']
        }, {
            validator: MustMatch('password', 'confirmPassword')
        });

        if (!this.isAddMode) {
            this.accountService.getById(this.id)
                .pipe(first())
                .subscribe(x => {
                    this.form.patchValue(x)
                    this.account = x;
                    if(this.account.role === 'Admin'){
                        this.form.get('isActive').disable();
                    }
                });
        }
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onFileSelected(event: any) {
        const file = event.target.files[0];
        if (file) {
            this.selectedFile = file;

            // Create a preview URL for the selected image
            const reader = new FileReader();
            reader.onload = e => this.previewUrl = reader.result;
            reader.readAsDataURL(file);
        }
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
        if (this.isAddMode) {
            this.createAccount();
        } else {
            this.updateAccount();
        }
    }

    private createAccount() {
        this.accountService.create(this.form.value)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Account created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateAccount() {
        this.loading = true;
        
        const formData = new FormData();
        
        formData.append('title', this.form.get('title')?.value);
        formData.append('firstName', this.form.get('firstName')?.value);

        const middleName = this.form.get('middleName')?.value;
        if (middleName) {
            formData.append('middleName', middleName);
        }
        
        formData.append('lastName', this.form.get('lastName')?.value);
        formData.append('email', this.form.get('email')?.value);
        formData.append('role', this.form.get('role')?.value);
        formData.append('gender', this.form.get('gender')?.value);
        formData.append('civilStatus', this.form.get('civilStatus')?.value);
        formData.append('birthDate', this.form.get('birthDate')?.value);
        formData.append('contactNumber', this.form.get('contactNumber')?.value);
        formData.append('password', this.form.get('password')?.value);
        formData.append('confirmPassword', this.form.get('confirmPassword')?.value);
        if (this.selectedFile) {
            formData.append('profilePicture', this.selectedFile, this.selectedFile.name);
        }
        //formData.isActive = this.isActiveValue;

        this.accountService.update(this.id, formData)
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

    checkAccountRole(): boolean {
        return this.account?.role === Role.Admin;
    }
}