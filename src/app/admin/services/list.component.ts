import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { ServicesService, AlertService } from '@app/_services';
import { Services } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    services: any[];
    displayedServices: Services[] = [];
    searchServices: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'servicesName';
    sortOrder: 'asc' | 'desc' = 'asc';
    errorMessage: string | null = null;

    constructor(
        private servicesService: ServicesService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.servicesService.getAll()
            .pipe(first())
            .subscribe(services => {
                this.services = services;
                this.totalEntries = this.services.length;
                this.updateDisplayedServices();
            });

    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedServices() {
        let filteredServices = this.services.filter(services =>
            services.servicesName.toLowerCase().includes(this.searchServices.toLowerCase())
        );

        filteredServices = this.sortServices(filteredServices);

        this.totalEntries = filteredServices.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedServices = filteredServices.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedServices();
        }
    }

    sortServices(services) {
        return services.sort((a, b) => {
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
        this.updateDisplayedServices();
    }

    onSearch() {
        console.log('Search term:', this.searchServices);
        this.currentPage = 1;
        this.updateDisplayedServices();
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
        this.updateDisplayedServices();
    }

    deleteServices(servicesId: string) {
        if (confirm('Are you sure you want to delete this services? This action cannot be undone.')) {
            const services = this.services.find(services => services.servicesId === servicesId);
            services.isDeleting = true;
            this.servicesService.delete(servicesId)
                .pipe(first())
                .subscribe(
                    () => {
                        this.alertService.success('Services deleted successfully', { keepAfterRouteChange: true });
                        this.services = this.services.filter(services => services.servicesId !== servicesId);
                        this.totalEntries = this.services.length;
                        this.updateDisplayedServices();
                    },
                    error => {
                        this.alertService.error('Failed to delete the services.');
                        services.isDeleting = false; 
                    }
                );
        }
    }
}
