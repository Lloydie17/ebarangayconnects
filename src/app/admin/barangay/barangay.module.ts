import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { BarangayRoutingModule } from './barangay-routing.module';
import { DetailsComponent } from './details.component';
import { EditComponent } from './edit.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        BarangayRoutingModule
    ],
    declarations: [
        DetailsComponent,
        EditComponent
    ]
})
export class BarangayModule { }