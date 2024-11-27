import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { ResidentService, AlertService } from '@app/_services';

@Component({ templateUrl: 'view.component.html' })
export class ViewComponent implements OnInit {
    form: FormGroup;
    id: string;
    isAddMode: boolean;
    loading = false;
    resident: any = {};
    isModalOpen: boolean = false;
    selectedImage: string = '';

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private residentService: ResidentService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['residentId'];
        console.log('Resident ID:', this.id);

        this.residentService.getById(this.id)
            .pipe(first())
            .subscribe(
                resident => {
                    console.log('Fetched resident:', resident);
                    this.resident = resident;}, 
                error => {
                    console.log('Error fetching resident:', error);
                    // Optional: navigate away if resident not found
                    this.router.navigate(['/']);
            });
    }

    approveResident(residentId: string) {
        this.residentService.verifyResident(residentId)
            .pipe(first())
            .subscribe(
                () => {
                    this.alertService.success('Resident approved successfully', { keepAfterRouteChange: true });
                    setTimeout(() => {
                        this.router.navigate(['/admin/verification'], { relativeTo: this.route });
                    }, 2000);
                },
                error => {
                    console.error('Error approving resident:', error);
                    this.alertService.error('Error approving resident');
                }
            );
    }

    openImageModal(imageUrl: string) {
        this.selectedImage = imageUrl;
        this.isModalOpen = true;
    }

    // Close modal
    closeImageModal() {
        this.isModalOpen = false;
        this.selectedImage = '';
    }
}