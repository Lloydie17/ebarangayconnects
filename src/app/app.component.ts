import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router'; // Add Router and NavigationEnd
import { filter } from 'rxjs/operators'; // Needed to filter router events

import { AccountService } from './_services';
import { Account, Role } from './_models';

@Component({ selector: 'app', templateUrl: 'app.component.html' })
export class AppComponent {
    Role = Role;
    account: Account;
    showSidenav: boolean = false; 
    showMainnav: boolean = true;
    showMenu: boolean = false;
    showSecondarynav: boolean = false;
    currentRouteClass: string = 'home';
    isSidenavCollapsed: boolean = false;

    constructor(private accountService: AccountService, private router: Router) {
        // Subscribe to account changes
        this.accountService.account.subscribe(x => this.account = x);

        this.router.events.pipe(
            filter(event => event instanceof NavigationEnd) 
        ).subscribe((event: NavigationEnd) => {
            this.checkIfSidenavShouldBeVisible(event.url);
            this.setBackgroundColor(event.url);
        });

        window.addEventListener('resize', this.onResize.bind(this));
        this.onResize(); 
    }

    checkIfSidenavShouldBeVisible(currentUrl: string) {
        if (currentUrl === '/' || currentUrl === '') {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'home';
        }
        else if (currentUrl === '/about') {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'about';
        }
        else if (currentUrl === '/announcement') {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'announcement';
        }
        else if (currentUrl.startsWith('/account')) {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'account';
        }
        else if (currentUrl.startsWith('/announcement-read')) {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'announcement-read';
        }
        else if (currentUrl === '/request' ) {
            this.showSidenav = false;
            this.showMainnav = true;
            this.showSecondarynav = false;
            this.currentRouteClass = 'request';
        }
        else {
            this.showSidenav = !!this.account; 
            this.showMainnav = false;
            this.showSecondarynav = true;
            this.currentRouteClass = 'admin';
        }
    }

    setBackgroundColor(currentUrl: string) {
        if (currentUrl.startsWith('/admin') || currentUrl.startsWith('/profile') || currentUrl.startsWith('/dashboard')) {
            document.body.style.backgroundColor = '#fafafa';  // Admin background color
        } else {
            document.body.style.backgroundColor = '';  // Reset to default color
        }
    }

    checkAccountRole(): boolean {
        return this.account?.role === Role.Admin;
    }

    toggleSidenav() {
        this.isSidenavCollapsed = !this.isSidenavCollapsed;
    }

    onResize() {
        if (window.innerWidth < 768) {
            this.isSidenavCollapsed = true;
        } else {
            this.isSidenavCollapsed = false;
        }
    }

    logout() {
        this.accountService.logout();
        this.router.navigate(['/']); // Redirect to home on logout
    }

    scrollToSection(sectionId: string): void {
        const element = document.getElementById(sectionId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }
}
