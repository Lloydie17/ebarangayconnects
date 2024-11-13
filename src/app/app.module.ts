import { NgModule, APP_INITIALIZER } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { CommonModule } from '@angular/common';

// used to create fake backend
// import { fakeBackendProvider } from './_helpers';

import { AppRoutingModule } from './app-routing.module';
import { JwtInterceptor, ErrorInterceptor, appInitializer } from './_helpers';
import { AccountService, ResidentService, ResidentRecordService } from './_services';
import { AppComponent } from './app.component';
import { AlertComponent, NotificationComponent } from './_components';
import { HomeComponent } from './home';
import { AboutComponent } from './about';
import { CertificateComponent, EmergencyComponent, PermitComponent } from './request';
import { RegisterComponent } from './register';
import { AnnouncementComponent, AnnouncementViewComponent } from './announcement';

@NgModule({
    imports: [
        BrowserModule,
        ReactiveFormsModule,
        HttpClientModule,
        AppRoutingModule,
        CommonModule
    ],
    declarations: [
        AppComponent,
        AlertComponent,
        NotificationComponent,
        HomeComponent,
        AboutComponent,
        RegisterComponent,
        CertificateComponent,
        EmergencyComponent,
        PermitComponent,
        AnnouncementComponent,
        AnnouncementViewComponent
    ],
    providers: [
        { provide: APP_INITIALIZER, useFactory: appInitializer, multi: true, deps: [AccountService] },
        { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
        { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
        ResidentService,
        ResidentRecordService,

        // provider used to create fake backend
        //fakeBackendProvider
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }