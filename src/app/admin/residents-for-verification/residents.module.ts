import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { ResidentsVerificationRoutingModule } from './residents-routing.module';
import { ListComponent } from './list.component';
import { ViewComponent } from './view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ResidentsVerificationRoutingModule
    ],
    declarations: [
        ListComponent,
        ViewComponent
    ]
})
export class ResidentsVerificationModule { }