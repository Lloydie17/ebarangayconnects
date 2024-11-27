import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { saveAs } from 'file-saver';
import { ResidentService, SitioService, HouseholdService, CategoryService, AlertService } from '@app/_services';
import { Resident } from '@app/_models';

import * as bootstrap from 'bootstrap';

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
    pageSize: number = 10;
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'fullName';
    sortOrder: 'asc' | 'desc' = 'asc';

    emailForm: FormGroup;
    submitted = false;

    constructor(
        private residentService: ResidentService,
        private householdService: HouseholdService,
        private categoryService: CategoryService,
        private sitioService: SitioService,
        private alertService: AlertService,
        private fb: FormBuilder
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

            // Initialize the form
        this.emailForm = this.fb.group({
            sitioId: ['', Validators.required],
            subject: ['', Validators.required],
            message: ['', Validators.required]
        });
    }

    get f() { return this.emailForm.controls; }

    openEmailModal() {
        this.submitted = false;
        this.emailForm.reset();
        // Open modal logic
        const modal = new bootstrap.Modal(document.getElementById('emailBlastModal'));
        modal.show();
    }

    onSubmit() {
        this.submitted = true;

        if (this.emailForm.invalid) {
            return;
        }

        const emailData = this.emailForm.value;

        this.residentService.sendBlastEmail(emailData.sitioId, emailData)
            .pipe(first())
            .subscribe({
                next: (response) => {
                    this.alertService.success(response.message, { keepAfterRouteChange: true });
                    // Close modal after success
                    const modal = bootstrap.Modal.getInstance(document.getElementById('emailBlastModal'));
                    modal.hide();
                },
                error: (error) => {
                    this.alertService.error(error.message);
                }
            });
    }

    exportToCSV() {
        const filteredResidents = this.residents.filter(resident => resident.status && resident.dump);

        const csvData = filteredResidents.map(({ status, dump, ...resident }) => resident);

        const headers = Object.keys(csvData[0]);
        const csvRows = [headers.join(',')];

        csvData.forEach(resident => {
            const values = headers.map(header => `"${resident[header] || ''}"`);
            csvRows.push(values.join(','));
        });

        const csvContent = csvRows.join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'residents.csv');
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

    updateDisplayedResidents() {
        const searchTerm = this.searchResident.toLowerCase();
        let filteredResidents = this.residents.filter(resident => {
            const fullName = resident.fullName || '';
            const age = resident.age || '';
            const voterStatus = resident.isVoter ? 'Voter' : 'Non-Voter';

            const matchesResidentFields = 
                fullName.toLowerCase().includes(searchTerm) || 
                age.toString().includes(searchTerm) || 
                voterStatus.includes(searchTerm);

            const household = this.households?.find(hh => hh.householdId === resident.householdId);
            const householdNo = household?.householdNo || '';
            const matchesHousehold = householdNo.toLowerCase().includes(searchTerm);

            const sitio = this.sitios?.find(s => s.sitioId === resident.sitioId);
            const sitioName = sitio?.sitioName || '';
            const matchesSitio = sitioName.toLowerCase().includes(searchTerm);

            return matchesResidentFields || matchesHousehold || matchesSitio;
        });

        filteredResidents = this.sortResidents(filteredResidents);

        this.totalEntries = filteredResidents.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedResidents = filteredResidents.slice(startIndex, endIndex);
    }

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

    getTotalPages(): number {
        return Math.ceil(this.totalEntries / this.pageSize);
    }

    onPageSizeChange(event: any) {
        this.pageSize = event.target.value;
        this.currentPage = 1;
        this.updateDisplayedResidents();
    }

    onSearch() {
        console.log('Search term:', this.searchResident);
        this.currentPage = 1;
        this.updateDisplayedResidents();
    }

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
                    this.alertService.error('You do not have permission to delete this resident.');
                    resident.isDeleting = false;
                }
            });
        }
    }
}
