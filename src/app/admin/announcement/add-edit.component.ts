import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AnnouncementService, AlertService } from '@app/_services';

@Component({ templateUrl: 'add-edit.component.html' })
export class AddEditComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    submitted = false;
    announcements: any = {};
    selectedFile: File | null = null;
    households: any = {};
    categories: any = {};
    sitios: any = {};
    previewUrl: string | ArrayBuffer | null = null;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private announcementService: AnnouncementService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['announcementId'];
        this.isAddMode = !this.id;

        this.form = this.formBuilder.group({
            announcementTitle: ['', Validators.required],
            announcementDescription: ['', Validators.required],
            announcementImage: ['']
        });

        if (!this.isAddMode) {
            this.announcementService.getById(this.id)
                .pipe(first())
                .subscribe(announcement => {
                    this.announcements = announcement; // Ensure this contains the profilePicture URL
                    this.form.patchValue(announcement);
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
            this.createAnnouncement();
        } else {
            this.updateAnnouncement();
        }
    }

    private createAnnouncement() {
        this.loading = true;

        const formData = new FormData();
        formData.append('announcementTitle', this.form.get('announcementTitle')?.value);
        formData.append('announcementDescription', this.form.get('announcementDescription')?.value);

        if (this.selectedFile) {
            formData.append('announcementImage', this.selectedFile);
        }
        
        this.announcementService.createAnnouncement(formData)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Announcement created successfully', { keepAfterRouteChange: true });
                    this.router.navigate(['../'], { relativeTo: this.route });
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }

    private updateAnnouncement() {
        this.loading = true;

        const formData = new FormData();
        Object.keys(this.form.controls).forEach(key => {
            const value = this.form.get(key)?.value;
            if (value !== null && value !== undefined) {
                formData.append(key, value);
            }
        });

        // Append selected files if they exist
        if (this.selectedFile) {
            formData.append('announcementImage', this.selectedFile);
        }


        this.announcementService.updateAnnouncement(this.id, formData)
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
