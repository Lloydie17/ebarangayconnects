import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { RequestService, AlertService, RequestDetailsService, ServicesService, NotificationService } from '@app/_services';
import { Request, RequestDetails, Services } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    id: string;
    request: any[];
    displayedRequest: Request[] = [];
    searchRequest: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'requestName';
    sortOrder: 'asc' | 'desc' = 'asc';
    errorMessage: string | null = null;
    requestDetails: RequestDetails[] = [];
    services: Services[] = [];

    constructor(
        private requestService: RequestService,
        private requestDetailsService: RequestDetailsService,
        private servicesService: ServicesService,
        private alertService: AlertService,
        private notificationService: NotificationService
    ) {}

    ngOnInit() {
        this.requestDetailsService.getAll()
            .pipe(first())
            .subscribe(requestDetails => {
                this.requestDetails = requestDetails;
                
                this.servicesService.getAll()
                    .pipe(first())
                    .subscribe(services => { 
                        this.services = services

                        this.requestService.getAll()
                            .pipe(first())
                            .subscribe(request => {
                                this.request = request;
                                this.totalEntries = this.request.length;
                                this.updateDisplayedRequest();
                        });
                });
            });
    }

    updateDisplayedRequest() {
        let filteredRequest = this.request.filter(request => {
            const requestDetail = this.requestDetails.find(rd => rd.requestId === request.requestId);

            if (requestDetail) {
                const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);
                return service?.servicesType === 'Permit';
            }
            return false;
        });

        // Apply search filter on the request name
        filteredRequest = filteredRequest.filter(request =>
            request.requestName.toLowerCase().includes(this.searchRequest.toLowerCase())
        );

        filteredRequest = this.sortRequest(filteredRequest);

        this.totalEntries = filteredRequest.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedRequest = filteredRequest.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedRequest();
        }
    }

    sortRequest(request) {
        return request.sort((a, b) => {
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
        this.currentPage = 1; // Reset to first page
        this.updateDisplayedRequest();
    }

    onSearch() {
        console.log('Search term:', this.searchRequest);
        this.currentPage = 1;
        this.updateDisplayedRequest();
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
        this.updateDisplayedRequest();
    }

    // Method to get the class for project status
    getStatusClass(status: number): string {
        switch (status) {
            case 1:
                return 'status-pending';
            case 2:
                return 'status-ongoing';
            case 3:
                return 'status-completed';
            default:
                return ''; // default class if none match
        }
    }

    // Method to get the status text for project status
    getStatusText(status: number): string {
        switch (status) {
            case 1:
                return 'Pending';
            case 2:
                return 'Processed';
            case 3:
                return 'Released';
            default:
                return ''; // default class if none match
        }
    }

    updateStatus(requestId: string, newStatus: number): void {
        this.requestService.updateStatus(requestId, { status: newStatus }).subscribe({
            next: () => {
                this.alertService.success('Request status updated successfully!');
                this.requestService.getAll().pipe(first()).subscribe(requests => {
                    this.request = requests;
                    this.updateDisplayedRequest();
                });
                this.notificationService.loadRequests();
            },
            error: (error) => {
                console.error('Error updating status:', error);
                this.alertService.error('Failed to update request status.');
            }
        });
    }

    generatePermit(requestId: string): void {
        this.requestService.generatePermit(requestId).subscribe({
            next: (htmlContent: string) => {
                // Create a Blob from the HTML content
                const blob = new Blob([htmlContent], { type: 'text/html' });
                const url = URL.createObjectURL(blob);
     
                const printWindow = window.open(url, '_blank');
                if (printWindow) {
                    printWindow.onload = () => {
                        printWindow.print();  // Open the print dialog
                        printWindow.onafterprint = () => {
                            URL.revokeObjectURL(url);  // Clean up the object URL after printing
                            printWindow.close();  // Close the print window after printing
                        };
                    };
                } else {
                    console.error('Failed to open print window');
                }
            },
            error: (error) => {
                console.error('Error generating certificate:', error);
            }
        });
    }
}
