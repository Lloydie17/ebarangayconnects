import { Component, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';

import { AccountService, AlertService } from '@app/_services';
import { Role } from '@app/_models';

@Component({ templateUrl: 'details.component.html' })
export class DetailsComponent {
    account = this.accountService.accountValue;
    Role = Role;
    form: FormGroup;
    loading = false;

    constructor(
        private accountService: AccountService,
        private formBuilder: FormBuilder,
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            title: [this.account.title],
            firstName: [this.account.firstName],
            middleName: [this.account.middleName || ''],
            lastName: [this.account.lastName],
            email: [this.account.email],
            civilStatus: [this.account.civilStatus],
            gender: [this.account.gender],
            birthDate: [this.account.birthDate],
            contactNumber: [this.account.contactNumber],
            role: [this.account.role],
            profilePicture: ['']
        });
    }
}