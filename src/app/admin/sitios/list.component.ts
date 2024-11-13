import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { SitioService, BarangayService, AlertService } from '@app/_services';
import { Sitio } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    sitios: any[];
    barangays: any[];
    displayedSitios: Sitio[] = [];
    searchSitio: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'sitioName';
    sortOrder: 'asc' | 'desc' = 'asc';
    errorMessage: string | null = null;

    constructor(
        private sitioService: SitioService,
        private barangayService: BarangayService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.sitioService.getAll()
            .pipe(first())
            .subscribe(sitios => {
                this.sitios = sitios;
                this.totalEntries = this.sitios.length;
                this.updateDisplayedSitios();

                this.barangayService.getAll()
                    .pipe(first())
                    .subscribe(barangays => this.barangays = barangays);
            });

    }

    getBarangayName(barangayId: number): string {
        const barangay = this.barangays.find(brgy => brgy.barangayId === barangayId);

        return barangay ? barangay.barangayName : 'Unknown Barangay';
    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedSitios() {
        let filteredSitios = this.sitios.filter(sitio =>
            sitio.sitioName.toLowerCase().includes(this.searchSitio.toLowerCase())
        );

        filteredSitios = this.sortSitios(filteredSitios);

        this.totalEntries = filteredSitios.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedSitios = filteredSitios.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedSitios();
        }
    }

    sortSitios(sitios) {
        return sitios.sort((a, b) => {
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
        this.updateDisplayedSitios();
    }

    onSearch() {
        console.log('Search term:', this.searchSitio);
        this.currentPage = 1;
        this.updateDisplayedSitios();
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
        this.updateDisplayedSitios();
    }

    deleteSitio(sitioId: string) {
        if (confirm('Are you sure you want to delete this sitio? This action cannot be undone.')) {
            const sitio = this.sitios.find(sitio => sitio.sitioId === sitioId);
            sitio.isDeleting = true;
            this.sitioService.delete(sitioId)
                .pipe(first())
                .subscribe(
                    () => {
                        this.alertService.success('Sitio deleted successfully', { keepAfterRouteChange: true });
                        this.sitios = this.sitios.filter(sitio => sitio.sitioId !== sitioId);
                        this.totalEntries = this.sitios.length;
                        this.updateDisplayedSitios();
                    },
                    error => {
                        this.alertService.error('Failed to delete the sitio because it is currently in use by residents.');
                        sitio.isDeleting = false; 
                    }
                );
        }
    }
}
