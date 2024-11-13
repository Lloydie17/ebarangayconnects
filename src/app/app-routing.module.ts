import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { HomeComponent } from './home';
import { RegisterComponent } from './register';
import { AboutComponent } from './about';
import { AnnouncementComponent, AnnouncementViewComponent } from './announcement';
import { DashboardComponent } from './dashboard';
import { CertificateComponent, EmergencyComponent, PermitComponent } from './request';
import { AuthGuard } from './_helpers';
import { Role } from './_models';

const accountModule = () => import('./account/account.module').then(x => x.AccountModule);
const adminModule = () => import('./admin/admin.module').then(x => x.AdminModule);
const profileModule = () => import('./profile/profile.module').then(x => x.ProfileModule);

const routes: Routes = [
    { path: '', component: HomeComponent },
    { path: 'about', component: AboutComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'announcement', component: AnnouncementComponent },
    { path: 'request/certificate/:servicesId', component: CertificateComponent },
    { path: 'request/emergency/:servicesId', component: EmergencyComponent },
    { path: 'request/permit/:servicesId', component: PermitComponent },
    { path: 'announcement-read/:announcementId', component: AnnouncementViewComponent },
    { path: 'dashboard', component: DashboardComponent, canActivate: [AuthGuard] },
    { path: 'account', loadChildren: accountModule },
    { path: 'profile', loadChildren: profileModule, canActivate: [AuthGuard] },
    { path: 'admin', loadChildren: adminModule, canActivate: [AuthGuard], data: { roles: [Role.Admin, Role.Staff] } },

    // otherwise redirect to home
    { path: '**', redirectTo: '' }
];

@NgModule({
    imports: [RouterModule.forRoot(routes)],
    exports: [RouterModule]
})
export class AppRoutingModule { }