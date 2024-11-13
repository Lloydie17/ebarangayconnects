import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { ResidentService, SitioService, HouseholdService, CategoryService, AlertService } from '@app/_services';
import { Resident } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    residents: any[];
    sitios: any[];
    households: any[];
    categories: any[];
    displayedResidents: Resident[] = [];
    searchResident: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'fullName';
    sortOrder: 'asc' | 'desc' = 'asc';

    constructor(
        private residentService: ResidentService,
        private householdService: HouseholdService,
        private categoryService: CategoryService,
        private sitioService: SitioService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
         this.residentService.getAll()
            .pipe(first())
            .subscribe(residents => {
                this.residents = residents.filter(resident => resident.status && resident.dump);
                this.totalEntries = this.residents.length;
                this.updateDisplayedResidents();

                this.sitioService.getAll()
                    .pipe(first())
                    .subscribe(sitios => this.sitios = sitios);

                this.householdService.getAll()
                    .pipe(first())
                    .subscribe(households => this.households = households);

                this.categoryService.getAll()
                    .pipe(first())
                    .subscribe(categories => this.categories = categories);
            });
    }

    getSitioName(sitioId: number): string {
        const sitio = this.sitios.find(sitio => sitio.sitioId === sitioId);

        return sitio ? sitio.sitioName : 'Unknown Sitio';
    }

    getHouseholdNumber(householdId: number): string {
        const household = this.households.find(household => household.householdId === householdId);

        return household ? household.householdNo : 'Unknown Household';
    }

    getCategoryType(categoryId: number): string {
        const category = this.categories.find(category => category.categoryId === categoryId);

        return category ? category.category : 'Unknown Category';
    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedResidents() {
        let filteredResidents = this.residents.filter(resident =>
            resident.fullName.toLowerCase().includes(this.searchResident.toLowerCase())
        );

        filteredResidents = this.sortResidents(filteredResidents);

        this.totalEntries = filteredResidents.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedResidents = filteredResidents.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedResidents();
        }
    }

    sortResidents(residents) {
        return residents.sort((a, b) => {
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
        this.updateDisplayedResidents();
    }

    onSearch() {
        console.log('Search term:', this.searchResident);
        this.currentPage = 1;
        this.updateDisplayedResidents();
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
        this.updateDisplayedResidents();
    }

    deleteResident(residentId: string) {
        if (confirm('Are you sure you want to delete this resident? This action cannot be undone.')) {
            const resident = this.residents.find(resident => resident.residentId === residentId);
            resident.isDeleting = true;
            this.residentService.deleteResident(residentId)
                .pipe(first())
                .subscribe({
                    next: () => {
                    this.alertService.success('Resident deleted successfully', { keepAfterRouteChange: true });
                    this.residents = this.residents.filter(resident => resident.residentId !== residentId);
                    this.totalEntries = this.residents.length;
                    this.updateDisplayedResidents();
                },
                error: () => {
                    // Show an alert or a message indicating insufficient permissions
                    this.alertService.error('You do not have permission to delete this resident.');
                    resident.isDeleting = false;
                }
            });
        }
    }
}
