import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { ProjectService, AccountService, AlertService } from '@app/_services';
import { Project } from '@app/_models';
import { saveAs } from 'file-saver';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    accounts: any[] = [];
    projects: any[] = [];
    displayedProject: Project[] = [];
    searchProject: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'fullName';
    sortOrder: 'asc' | 'desc' = 'asc';
    errorMessage: string | null = null;

    constructor(
        private projectService: ProjectService,
        private accountService: AccountService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.projectService.getAll()
            .pipe(first())
            .subscribe(projects => {
                this.projects = projects;
                this.totalEntries = this.projects.length;
                this.updateDisplayedProject();

                this.accountService.getAll()
                    .pipe(first())
                    .subscribe(accounts => {
                        this.accounts = accounts
                        this.updateDisplayedProject();
                    });
                    
            });

    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedProject() {
        let filteredProject = this.projects.filter(projects => {
                const fullName = this.getName(projects.accountId)
                return fullName.toLowerCase().includes(this.searchProject.toLowerCase());
        });

        filteredProject = this.sortProject(filteredProject);
        this.totalEntries = filteredProject.length;

        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = startIndex + this.pageSize;
        
        this.displayedProject = filteredProject.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedProject();
        }
    }

    sortProject(projects) {
        return projects.sort((a, b) => {
            const fullNameA = this.getName(a.accountId).toLowerCase();
            const fullNameB = this.getName(b.accountId).toLowerCase();

            if (fullNameA < fullNameB) return this.sortOrder === 'asc' ? -1 : 1;
            if (fullNameA > fullNameB) return this.sortOrder === 'asc' ? 1 : -1;
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
        this.updateDisplayedProject();
    }

    onSearch() {
        console.log('Search term:', this.searchProject);
        this.currentPage = 1;
        this.updateDisplayedProject();
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
        this.updateDisplayedProject();
    }

    deleteProject(projectId: string) {
        if (confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            const project = this.projects.find(project => project.projectId === projectId);
            project.isDeleting = true;
            this.projectService.delete(projectId)
                .pipe(first())
                .subscribe(
                    () => {
                        this.alertService.success('Project deleted successfully', { keepAfterRouteChange: true });
                        this.projects = this.projects.filter(project => project.projectId !== projectId);
                        this.totalEntries = this.projects.length;
                        this.updateDisplayedProject();
                    },
                    error => {
                        this.alertService.error('Failed to delete the project.');
                        project.isDeleting = false; 
                    }
                );
        }
    }

    // Method to get the class for project status
    getStatusClass(projectStatus: number): string {
        switch (projectStatus) {
            case 1:
                return 'status-cancelled';
            case 2:
                return 'status-pending';
            case 3:
                return 'status-ongoing';
            case 4:
                return 'status-completed';
            default:
                return ''; // default class if none match
        }
    }

    // Method to get the status text for project status
    getStatusText(projectStatus: number): string {
        switch (projectStatus) {
            case 1:
                return 'Cancelled';
            case 2:
                return 'Pending Approval';
            case 3:
                return 'Ongoing';
            case 4:
                return 'Completed';
            default:
                return 'Unknown';
        }
    }

    getName(accountId: number): string {
        const account = this.accounts.find(account => account.id === accountId);

        return account ? account.fullName : 'Unknown Name';
    }

    getTitle(accountId: number): string {
        const account = this.accounts.find(account => account.id === accountId);

        return account ? account.title : 'Unknown Name';
    }

    truncateDescription(description: string, maxLength: number = 100): string {
        if (description.length > maxLength) {
            return description.substring(0, maxLength) + '...';
        }
        return description;
    }

    exportToCSV() {
        const completedProjects = this.projects.filter(project => project.projectStatus === 4);

        // Prepare the header
        const header = ['Fullname', 'Project Name', 'Project Description', 'Project Remarks', 'Budget', 'Start Date', 'End Date', 'Status'];
    
        // Prepare the rows
        const rows = completedProjects.map(project => {
            const fullName = this.getName(project.accountId);
            const projectName = project.projectName;
            const projectDescription = project.projectDescription;
            const projectRemarks = project.projectRemarks;
            const budget = project.projectBudget;
            const startDate = project.startDate;
            const endDate = project.endDate;
            const status = this.getStatusText(project.projectStatus);
    
            return [fullName, projectName, projectDescription, projectRemarks, budget, startDate, endDate, status];
        });
    
        // Combine header and rows into CSV content
        const csvContent = [header, ...rows].map(row => row.join(',')).join('\n');
    
        // Create a Blob and trigger the download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        saveAs(blob, 'projects.csv');
    }
}
