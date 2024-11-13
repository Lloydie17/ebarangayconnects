import { Component } from '@angular/core';
import { first } from 'rxjs/operators';
import { AnnouncementService, AccountService } from '@app/_services';
import { Router } from '@angular/router';
import { Announcement } from '@app/_models';

@Component({ templateUrl: 'announcement.component.html'})

export class AnnouncementComponent {
    account = this.accountService.accountValue;
    announcements: any[] = [];

    constructor(
        private accountService: AccountService,
        private announcementService: AnnouncementService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.announcementService.getAll()
        .pipe(first())
        .subscribe(announcements => {
            this.announcements = announcements.map(announcement => ({
                ...announcement,
                announcementImage: announcement.announcementImage.replace(/^"|"$/g, '') // Remove surrounding quotes
            }));
        });
    }

    truncateDescription(description: string, maxLength: number = 100): string {
        if (description.length > maxLength) {
            return description.substring(0, maxLength) + '...';
        }
        return description;
    }
}