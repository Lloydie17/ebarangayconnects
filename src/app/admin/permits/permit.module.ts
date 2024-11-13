import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PermitRoutingModule } from './permit-routing.module';
import { ListComponent } from './list.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        PermitRoutingModule
    ],
    declarations: [
        ListComponent,
    ]
})
export class PermitModule { }