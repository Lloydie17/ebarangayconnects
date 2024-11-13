import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { RequestedRoutingModule } from './requested-routing.module';
import { ListComponent } from './list.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        RequestedRoutingModule
    ],
    declarations: [
        ListComponent,
    ]
})
export class RequestedModule { }