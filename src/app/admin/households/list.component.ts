import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { HouseholdService, AlertService } from '@app/_services';
import { Household } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    households: any[];
    displayedHouseholds: Household[] = [];
    searchHousehold: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'householdOwner';
    sortOrder: 'asc' | 'desc' = 'asc';

    constructor(
        private householdService: HouseholdService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.householdService.getAll()
            .pipe(first())
            .subscribe(households => {
                this.households = households;
                this.totalEntries = this.households.length;
                this.updateDisplayedHouseholds();
            });

    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedHouseholds() {
        let filteredhouseholds = this.households.filter(household =>
            household.householdOwner.toLowerCase().includes(this.searchHousehold.toLowerCase())
        );

        filteredhouseholds = this.sortHouseholds(filteredhouseholds);

        this.totalEntries = filteredhouseholds.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedHouseholds = filteredhouseholds.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedHouseholds();
        }
    }

    sortHouseholds(households) {
        return households.sort((a, b) => {
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
        this.updateDisplayedHouseholds();
    }

    onSearch() {
        console.log('Search term:', this.searchHousehold);
        this.currentPage = 1;
        this.updateDisplayedHouseholds();
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
        this.updateDisplayedHouseholds();
    }

    deleteHousehold(householdId: string) {
        const household = this.households.find(hh => hh.householdId === householdId);
        household.isDeleting = true;
        this.householdService.delete(householdId)
            .pipe(first())
            .subscribe(() => {
                this.alertService.success('Household deleted successfully', { keepAfterRouteChange: true });
                this.households = this.households.filter(hh => hh.householdId !== householdId);
                this.totalEntries = this.households.length;
                this.updateDisplayedHouseholds();
            });
    }
}
