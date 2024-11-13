import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { AnnouncementService, AlertService } from '@app/_services';
import { Announcement } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    announcements: any[];
    displayedAnnouncement: Announcement[] = [];
    searchAnnouncement: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'announcementTitle';
    sortOrder: 'asc' | 'desc' = 'asc';

    constructor(
        private announcementService: AnnouncementService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
         this.announcementService.getAll()
            .pipe(first())
            .subscribe(announcements => {
                this.announcements = announcements;
                this.totalEntries = this.announcements.length;
                this.updateDisplayedAnnouncements();
            });
    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedAnnouncements() {
        let filteredAnnouncements = this.announcements.filter(announcement =>
            announcement.announcementTitle.toLowerCase().includes(this.searchAnnouncement.toLowerCase())
        );

        filteredAnnouncements = this.sortAnnouncements(filteredAnnouncements);

        this.totalEntries = filteredAnnouncements.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedAnnouncement = filteredAnnouncements.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedAnnouncements();
        }
    }

    sortAnnouncements(announcements) {
        return announcements.sort((a, b) => {
            const valueA = a[this.sortColumn].toLowerCase();
            const valueB = b[this.sortColumn].toLowerCase();

            if (valueA < valueB) return this.sortOrder === 'asc' ? -1 : 1;
            if (valueA > valueB) return this.sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Get total pages
    getTotalPages(): number {
        return Math.ceil(this.totalEntries / this.pageSize);
    }

    // Handle page size change
    onPageSizeChange(event: any) {
        this.pageSize = event.target.value;
        this.currentPage = 1; // Reset sa first page
        this.updateDisplayedAnnouncements();
    }

    onSearch() {
        console.log('Search term:', this.searchAnnouncement);
        this.currentPage = 1;
        this.updateDisplayedAnnouncements();
    }

    // Helpers
    getStartIndex(): number {
        return (this.currentPage - 1) * this.pageSize + 1;
    }

    getEndIndex(): number {
        return Math.min(this.currentPage * this.pageSize, this.totalEntries);
    }

    sortBy(column: string, order: 'asc' | 'desc') {
        this.sortColumn = column;
        this.sortOrder = order;
        this.updateDisplayedAnnouncements();
    }

    deleteAnnouncement(announcementId: string) {
        if (confirm('Are you sure you want to delete this announcement?? This action cannot be undone.')) {
            const announcement = this.announcements.find(announcement => announcement.announcementId === announcementId);
            announcement.isDeleting = true;
            this.announcementService.delete(announcementId)
                .pipe(first())
                .subscribe({
                    next: () => {
                    this.alertService.success('Announcement deleted successfully', { keepAfterRouteChange: true });
                    this.announcements = this.announcements.filter(announcement => announcement.announcementId !== announcementId);
                    this.totalEntries = this.announcements.length;
                    this.updateDisplayedAnnouncements();
                },
                error: () => {
                    // Show an alert or a message indicating insufficient permissions
                    this.alertService.error('You do not have permission to delete this resident.');
                    announcement.isDeleting = false;
                }
            });
        }
    }
}
