import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ListComponent } from './list.component';
import { ViewComponent } from './view.component';

const routes: Routes = [
    { path: '', component: ListComponent },
    { path: 'view/:requestId', component: ViewComponent },
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AssistanceRoutingModule { }