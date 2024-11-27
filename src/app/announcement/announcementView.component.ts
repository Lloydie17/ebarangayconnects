import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { AnnouncementService } from '@app/_services';
import { Router, ActivatedRoute, ParamMap } from '@angular/router';
import { Announcement } from '@app/_models';

@Component({ templateUrl: 'announcementView.component.html' })
export class AnnouncementViewComponent implements OnInit {
    id: string;
    announcement: Announcement;
    nextAnnouncement: Announcement = null;
    previousAnnouncement: Announcement = null;

    constructor(
        private announcementService: AnnouncementService,
        private route: ActivatedRoute,
        private router: Router
    ) {}

    ngOnInit() {
        // Subscribe to route parameter changes
        this.route.paramMap.subscribe((params: ParamMap) => {
            this.id = params.get('announcementId');
            this.loadAnnouncement();
        });
    }

    loadAnnouncement() {
        // Load current announcement
        this.announcementService.getById(this.id)
            .pipe(first())
            .subscribe(announcement => this.announcement = announcement);

        // Load next announcement
        this.announcementService.getNext(this.id)
            .pipe(first())
            .subscribe(
                next => this.nextAnnouncement = next,
                () => this.nextAnnouncement = null // Clear if no next announcement
            );

        // Load previous announcement
        this.announcementService.getPrevious(this.id)
            .pipe(first())
            .subscribe(
                prev => this.previousAnnouncement = prev,
                () => this.previousAnnouncement = null // Clear if no previous announcement
            );
    }

    goToAnnouncement(announcementId: string) {
        this.router.navigate([`/announcement-read/${announcementId}`]);
    }
}
