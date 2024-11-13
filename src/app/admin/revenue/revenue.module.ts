import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RevenueRoutingModule } from './revenue-routing.module';
import { ListComponent } from './list.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RevenueRoutingModule
    ],
    declarations: [
        ListComponent,
    ]
})
export class RevenueModule { }