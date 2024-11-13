import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';

import { AccountService, AlertService } from '@app/_services';
import { Role } from '@app/_models';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
    private restrictedRoutes: string[] = ['/admin/services', '/admin/accounts', '/admin/projects'];
    
    constructor(
        private router: Router,
        private accountService: AccountService,
        private alertService: AlertService,
    ) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        const account = this.accountService.accountValue;
        if (account) {

            // Check if accessing the specific restricted route
            if (this.restrictedRoutes.includes(state.url) && account.role !== Role.Admin) {
                this.alertService.warning('Staff trying to access services, redirecting to dashboard');
                this.router.navigate(['/dashboard']);
                return false;
            }

            // check if route is restricted by role
            if (route.data.roles && !route.data.roles.includes(account.role)) {
                // role not authorized so redirect to home page
                this.router.navigate(['/']);
                return false;
            }

            // authorized so return true
            return true;
        }

        // not logged in so redirect to login page with the return url 
        this.router.navigate(['/account/login'], { queryParams: { returnUrl: state.url }});
        return false;
    }
}