import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AssistanceRoutingModule } from './assistance-routing.module';
import { ListComponent } from './list.component';
import { ViewComponent } from './view.component';

@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        AssistanceRoutingModule
    ],
    declarations: [
        ListComponent,
        ViewComponent,
    ]
})
export class AssistanceModule { }