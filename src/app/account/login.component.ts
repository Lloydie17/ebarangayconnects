import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { first } from 'rxjs/operators';

import { AccountService, AlertService, BarangayService } from '@app/_services';
import { Barangay } from '@app/_models';

@Component({ templateUrl: 'login.component.html' })
export class LoginComponent implements OnInit {
    form: FormGroup;
    loading = false;
    submitted = false;
    barangay: Barangay;

    constructor(
        private formBuilder: FormBuilder,
        private route: ActivatedRoute,
        private router: Router,
        private accountService: AccountService,
        private barangayService: BarangayService,
        private alertService: AlertService
    ) { }

    ngOnInit() {
        this.barangayService.getAll().subscribe(barangays => {
            // Assuming you only need the first barangay from the array
            this.barangay = barangays[0]; 
        });


        this.form = this.formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required]
        });
    }

    // convenience getter for easy access to form fields
    get f() { return this.form.controls; }

    onSubmit() {
        this.submitted = true;

        // reset alerts on submit
        this.alertService.clear();

        // stop here if form is invalid
        if (this.form.invalid) {
            return;
        }
        

        this.loading = true;
        this.accountService.login(this.f.email.value, this.f.password.value)
            .pipe(first())
            .subscribe({
                next: (account) => {
                    // Check if profile details are missing and redirect if necessary
                    if (!account.birthDate || !account.gender || !account.civilStatus || !account.contactNumber) {
                        this.router.navigate(['/profile/update']);
                    } else {
                        // get return url from query parameters or default to home page
                        const returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
                        this.router.navigateByUrl(returnUrl);
                    }
                },
                error: error => {
                    this.alertService.error(error);
                    this.loading = false;
                }
            });
    }
}