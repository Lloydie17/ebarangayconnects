import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { HouseholdService, CategoryService, ResidentService, AlertService, SitioService } from '@app/_services';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    residents: any = {};
    selectedProfilePicture: File | null = null;
    selectedIdPicture: File | null = null;
    households: any = {};
    categories: any = {};
    sitios: any = {};
    previewUrl: string | ArrayBuffer | null = null;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private residentService: ResidentService,
        private householdService: HouseholdService,
        private categoryService: CategoryService,
        private sitioService: SitioService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['residentId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            firstName: ['', Validators.required],
            middleName: [],   
            lastName: ['', Validators.required],
            alias: [],
            birthDate: ['', Validators.required],            
            birthPlace: ['', Validators.required],           
            civilStatus: ['', Validators.required],     
            gender: ['', Validators.required],
            occupation: [],     
            email: ['', [Validators.required, Validators.email]],
            contactNumber: ['', [Validators.required, Validators.pattern('^[0-9]{11}$')]],
            precintNo: [{value: '', disabled: true}], 
            sitioId: ['', Validators.required], 
            householdId: ['', Validators.required],
            categoryId: ['', Validators.required],
            isVoter: [false, Validators.required], 
            profilePicture: [''], 
            idPicture: [''],
            status: [true],
        });

        this.form.get('isVoter')?.valueChanges.subscribe(value => {
            if (value === true) {
                this.form.get('precintNo')?.enable();
            } else {
                this.form.get('precintNo')?.disable();
                this.form.get('precintNo')?.reset();
            }
        });

        if (!this.isAddMode) {
            this.residentService.getById(this.id)
                .pipe(first())
                .subscribe(resident => {
                    this.residents = resident; // Ensure this contains the profilePicture URL
                    this.form.patchValue(resident);
                });
        }

        this.loadHousehold();
        this.loadCategory();
        this.loadSitio();
    }

    private loadHousehold() {
        this.householdService.getAll()
            .pipe(first())
            .subscribe(households => {
                this.households = households;
            });
    }

    private loadCategory() {
        this.categoryService.getAll()
            .pipe(first())
            .subscribe(categories => {  
                this.categories = categories;
            });
    }

    private loadSitio() {
        this.sitioService.getAll()
            .pipe(first())
            .subscribe(sitios => {
                this.sitios = sitios;
            });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onFileSelected(event: any, type: string) {
        const file = event.target.files[0];
        if (file) {
            if (type === 'profilePicture') {
                this.selectedProfilePicture = file;

                const reader = new FileReader();
                reader.onload = e => this.previewUrl = reader.result;
                reader.readAsDataURL(file);
            } else if (type === 'idPicture') {
                this.selectedIdPicture = file;
            }
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
            this.createResident();
        } else {
            this.updateResident();
        }
    }

    private createResident() {
        this.loading = true;

        const formData = new FormData();
        formData.append('firstName', this.form.get('firstName')?.value);

        const middleName = this.form.get('middleName')?.value;
        if (middleName) {
            formData.append('middleName', middleName);
        }
        
        formData.append('lastName', this.form.get('lastName')?.value);

        const alias = this.form.get('alias')?.value;
        if (alias) {
            formData.append('alias', alias);
        }

        formData.append('birthDate', this.form.get('birthDate')?.value);
        formData.append('birthPlace', this.form.get('birthPlace')?.value);
        formData.append('civilStatus', this.form.get('civilStatus')?.value);
        formData.append('gender', this.form.get('gender')?.value);

        const occupation = this.form.get('occupation')?.value;
        if (occupation) {
            formData.append('occupation', occupation);
        }

        formData.append('email', this.form.get('email')?.value);
        formData.append('contactNumber', this.form.get('contactNumber')?.value);

        const precintNo = this.form.get('precintNo')?.value;
        if (precintNo) {
            formData.append('precintNo', precintNo);
        }

        formData.append('sitioId', this.form.get('sitioId')?.value);
        formData.append('householdId', this.form.get('householdId')?.value);
        formData.append('categoryId', this.form.get('categoryId')?.value);
        formData.append('isVoter', this.form.get('isVoter')?.value);
        formData.append('status', this.form.get('status')?.value);

        // Append selected files if they exist
        if (this.selectedProfilePicture) {
            formData.append('profilePicture', this.selectedProfilePicture);
        }
        if (this.selectedIdPicture) {
            formData.append('idPicture', this.selectedIdPicture);
        }
        
        this.residentService.createResident(formData)
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

    private updateResident() {
        this.loading = true;

        const formData = new FormData();
        Object.keys(this.form.controls).forEach(key => {
            const value = this.form.get(key)?.value;
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        // Append selected files if they exist
        if (this.selectedProfilePicture) {
            formData.append('profilePicture', this.selectedProfilePicture);
        }
        if (this.selectedIdPicture) {
            formData.append('idPicture', this.selectedIdPicture);
        }


        this.residentService.updateResident(this.id, formData)
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
}