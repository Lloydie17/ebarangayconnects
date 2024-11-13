import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { DetailsComponent } from './details.component';
import { EditComponent } from './edit.component';

const routes: Routes = [
    { path: '', component: DetailsComponent },
    { path: 'edit/:barangayId', component: EditComponent }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class BarangayRoutingModule { }