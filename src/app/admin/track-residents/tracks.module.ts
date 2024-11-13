import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { TracksRoutingModule } from './tracks-routing.module';
import { TrackComponent } from './track.component';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        TracksRoutingModule
    ],
    declarations: [
        TrackComponent
    ]
})
export class TracksModule { }