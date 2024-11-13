import { Component, OnInit, Renderer2, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { first } from 'rxjs/operators';

import { NotificationService, RequestService, RequestDetailsService, ServicesService, } from '@app/_services';
import { Request, RequestDetails, Services } from '@app/_models';

@Component({selector: 'notification', templateUrl: 'notification.component.html'})
export class NotificationComponent implements OnInit {
    showNotificationDropdown: boolean = false;
    notifications: any[] = [];
    requestDetails: RequestDetails[] = [];
    services: Services[] = [];
    request: any[];
    newNotifications: any[] = [];
    earlierNotifications: any[] = [];
    pendingNotifications: any[] = [];
    processedNotifications: any[] = [];

    constructor(
        private notificationService: NotificationService,
        private requestService: RequestService,
        private requestDetailsService: RequestDetailsService,
        private servicesService: ServicesService,
        private router: Router,
        private renderer: Renderer2,
        private el: ElementRef
    ) {}

    ngOnInit() {
        // Load pending requests for notifications
        this.notificationService.loadRequests();

        this.notificationService.notifications$.subscribe(notifications => {
            this.notifications = notifications;
            this.filterNotifications();
        });

        this.requestDetailsService.getAll()
            .pipe(first())
            .subscribe(requestDetails => {
                this.requestDetails = requestDetails;
                
                this.servicesService.getAll()
                    .pipe(first())
                    .subscribe(services => { 
                        this.services = services

                        this.requestService.getAll()
                            .pipe(first())
                            .subscribe(request => {
                                this.request = request;
                        });
                });
            });

        this.renderer.listen('document', 'click', (event: MouseEvent) => {
            const targetElement = event.target as HTMLElement;
            // Check if the clicked element is outside the notification wrapper
            if (this.showNotificationDropdown && !this.el.nativeElement.contains(targetElement)) {
                this.showNotificationDropdown = false; // Close the dropdown
            }
        });
    }
    

    filterNotifications() {
        const now = new Date();
        const oneDayInMillis = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    
        // Sort notifications by createdAt in descending order
        this.notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
        // Filter new notifications (not seen and within the last day)
        this.newNotifications = this.notifications.filter(notification => {
            const notificationDate = new Date(notification.createdAt);
            return !notification.seen && (now.getTime() - notificationDate.getTime() < oneDayInMillis);
        });
    
        // Filter earlier notifications (either seen or older than one day)
        this.earlierNotifications = this.notifications.filter(notification => {
            const notificationDate = new Date(notification.createdAt);
            return notification.seen || (now.getTime() - notificationDate.getTime() >= oneDayInMillis);
        });
    }

    formatTimestamp(createdAt: string): string {
        const now = new Date();
        const notificationDate = new Date(createdAt);
        const diffInSeconds = Math.floor((now.getTime() - notificationDate.getTime()) / 1000);

        if (diffInSeconds < 60) {
            return `${diffInSeconds} seconds ago`;
        } else if (diffInSeconds < 3600) {
            return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        } else if (diffInSeconds < 86400) {
            return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        } else {
            return `${Math.floor(diffInSeconds / 86400)} days ago`;
        }
    }

    toggleNotificationDropdown() {
        this.showNotificationDropdown = !this.showNotificationDropdown;
    }

    viewNotification(notification: any) {
        this.notificationService.markAsSeen(notification.id);
        this.filterNotifications();

        const requestDetail = this.requestDetails.find(rd => rd.requestId === notification.id);

        if (requestDetail) {
            const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);
            
            // Check the servicesType and redirect accordingly
            if (service) {
                if (service.servicesType === 'Certificate') {
                    this.router.navigate(['/admin/requested']);
                } else if (service.servicesType === 'Permit') {
                    this.router.navigate(['/admin/permit']);
                } else if (service.servicesType === 'Emergency') {
                    this.router.navigate(['/admin/assistance/view/', notification.id]);
                }
            }
        }
    }

    getServiceName(notification: any) {
        const requestDetail = this.requestDetails.find(rd => rd.requestId === notification.id);

        if (requestDetail) {
            const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);

            if(service) {
                return service?.servicesName;
            }
        }
    }

    getServiceTypeClass(notification: any) {
        const requestDetail = this.requestDetails.find(rd => rd.requestId === notification.id);

        if (requestDetail) {
            const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);

            if(service.servicesType === 'Emergency'){
                return 'status-pending';
            }
        }
    }
}
