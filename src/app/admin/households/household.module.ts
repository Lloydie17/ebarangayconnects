import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { HouseholdRoutingModule } from './household-routing.module';
import { ListComponent } from './list.component';
import { AddEditComponent } from './add-edit.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        HouseholdRoutingModule
    ],
    declarations: [
        ListComponent,
        AddEditComponent
    ]
})
export class HouseholdModule { }