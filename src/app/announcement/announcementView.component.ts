import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';
import { AnnouncementService, AccountService } from '@app/_services';
import { Router, ActivatedRoute } from '@angular/router';
import { Announcement } from '@app/_models';

@Component({ templateUrl: 'announcementView.component.html' })
export class AnnouncementViewComponent implements OnInit {
    id: string;
    announcement: Announcement;

    constructor(
        private accountService: AccountService,
        private announcementService: AnnouncementService,
        private route: ActivatedRoute
    ) {}

    ngOnInit() {
        this.id = this.route.snapshot.params['announcementId'];

        this.announcementService.getById(this.id)
            .pipe(first())
            .subscribe(announcement => this.announcement = announcement);
    }
}
