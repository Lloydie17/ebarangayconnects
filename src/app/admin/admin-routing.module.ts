import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { LayoutComponent } from './layout.component';
import { OverviewComponent } from './overview.component';
import { AuthGuard } from '../_helpers'; // Import AuthGuard
import { Role } from '@app/_models';

const accountsModule = () => import('./accounts/accounts.module').then(x => x.AccountsModule);
const residentsModule = () => import('./residents/residents.module').then(x => x.ResidentsModule);
const residentsVerificationModule = () => import('./residents-for-verification/residents.module').then(x => x.ResidentsVerificationModule);
const sitioModule = () => import('./sitios/sitio.module').then(x => x.SitioModule);
const categoryModule = () => import('./categories/category.module').then(x => x.CategoryModule);
const householdModule = () => import('./households/household.module').then(x => x.HouseholdModule);
const tracksModule = () => import('./track-residents/tracks.module').then(x => x.TracksModule);
const servicesModule = () => import('./services/services.module').then(x => x.ServicesModule);
const projectModule = () => import('./projects/project.module').then(x => x.ProjectModule);
const requestedModule = () => import('./requested/requested.module').then(x => x.RequestedModule);
const permitModule = () => import('./permits/permit.module').then(x => x.PermitModule);
const assistanceModule = () => import('./assistance/assistance.module').then(x => x.AssistanceModule);
const barangayModule = () => import('./barangay/barangay.module').then(x => x.BarangayModule);
const announcementModule = () => import('./announcement/announcement.module').then(x => x.AnnouncementModule);
const revenueModule = () => import('./revenue/revenue.module').then(x => x.RevenueModule);

const routes: Routes = [
    {
        path: '', component: LayoutComponent, canActivate: [AuthGuard], // Apply AuthGuard here
        children: [
            { path: 'accounts', loadChildren: accountsModule, data: { roles: [Role.Admin] } },
            { path: 'residents', loadChildren: residentsModule },
            { path: 'verification', loadChildren: residentsVerificationModule },
            { path: 'sitios', loadChildren: sitioModule },
            { path: 'category', loadChildren: categoryModule },
            { path: 'households', loadChildren: householdModule },
            { path: 'track-resident', loadChildren: tracksModule },
            { path: 'barangay', loadChildren: barangayModule },
            { path: 'announcement', loadChildren: announcementModule },
            { path: 'revenue', loadChildren: revenueModule },
            { path: 'services', loadChildren: servicesModule, data: { roles: [Role.Admin] } },
            { path: 'projects', loadChildren: projectModule, data: { roles: [Role.Admin] } },
            { path: 'requested', loadChildren: requestedModule, data: { roles: [Role.Admin] } },
            { path: 'permit', loadChildren: permitModule, data: { roles: [Role.Admin] } },
            { path: 'assistance', loadChildren: assistanceModule, data: { roles: [Role.Admin] } },
        ]
    }
];

@NgModule({
    imports: [RouterModule.forChild(routes)],
    exports: [RouterModule]
})
export class AdminRoutingModule { }
