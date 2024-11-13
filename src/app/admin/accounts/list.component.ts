import { Component, OnInit } from '@angular/core';
import { first } from 'rxjs/operators';

import { AccountService, AlertService } from '@app/_services';
import { Account } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    accounts: any[];
    displayedAccounts: Account[] = [];
    searchAccounts: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'fullName';
    sortOrder: 'asc' | 'desc' = 'asc';

    constructor(
        private accountService: AccountService,
        private alertService: AlertService
    ) {}

    ngOnInit() {
        this.accountService.getAll()
            .pipe(first())
            .subscribe(accounts => {
                this.accounts = accounts;
                this.totalEntries = this.accounts.length;
                this.updateDisplayedAccounts();
            });
    }

    // Update the displayed accounts based on pagination and page size
    updateDisplayedAccounts() {
        let filteredAccounts = this.accounts.filter(account =>
            account.fullName.toLowerCase().includes(this.searchAccounts.toLowerCase())
        );

        filteredAccounts = this.sortAccounts(filteredAccounts);

        this.totalEntries = filteredAccounts.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedAccounts = filteredAccounts.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedAccounts();
        }
    }

    sortAccounts(accounts) {
        return accounts.sort((a, b) => {
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
        this.updateDisplayedAccounts();
    }

    onSearch() {
        console.log('Search term:', this.searchAccounts);
        this.currentPage = 1;
        this.updateDisplayedAccounts();
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
        this.updateDisplayedAccounts();
    }

    sendEmail(id: string) {
        // Find the account by ID
        const account = this.accounts.find(x => x.id === id);
    
        // Check if the account is verified before sending the email
        if (account.isVerified) {
            // If the account is already verified, show an error message
            this.alertService.error('Failed to send email! Account is already verified.');
            return;  
        }
    
        // If not verified, proceed to send the email
        this.accountService.sendEmail(id)
            .pipe(first())
            .subscribe({
                next: () => {
                    this.alertService.success('Email sent successfully!', { keepAfterRouteChange: true });
                },
                error: () => {
                    this.alertService.error('Failed to send email!');
                }
            });
    }
}