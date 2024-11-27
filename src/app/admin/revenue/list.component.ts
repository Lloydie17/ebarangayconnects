import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { RequestService, AlertService, RequestDetailsService, ServicesService, NotificationService, AccountService } from '@app/_services';
import { Request, RequestDetails, Services } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    id: string;
    request: any[];
    accounts: any[];
    displayedRequest: Request[] = [];
    searchRequest: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'date';
    sortOrder: 'asc' | 'desc' = 'asc';
    errorMessage: string | null = null;
    requestDetails: RequestDetails[] = [];
    services: Services[] = [];
    minDate: string = '';
    maxDate: string = '';

    constructor(
        private requestService: RequestService,
        private accountService: AccountService,
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
                                this.request = request.filter(request => request.status === 3);
                                this.totalEntries = this.request.length;
                                this.updateDisplayedRequest();
                        });

                        this.accountService.getAll()
                            .pipe(first())
                            .subscribe(accounts => {
                                this.accounts = accounts
                            })
                });
            });
    }

    exportToCSV() {
        const headers = ['Date', 'Recipient', 'Details', 'Amount', 'Processed By'];
    
        // Filter requests by status and date range
        const filteredRequests = this.request
            .filter(request => request.status === 3)
            .filter(request => {
                const requestDate = new Date(request.date);
                const minDate = this.minDate ? new Date(this.minDate) : null;
                const maxDate = this.maxDate ? new Date(this.maxDate) : null;
    
                // Apply minimum and maximum date filters
                return (!minDate || requestDate >= minDate) && (!maxDate || requestDate <= maxDate);
            });
    
        const rows = filteredRequests.map(request => {
            const date = new Date(request.date).toLocaleDateString();
            const recipient = request.requestName;
            const details = this.getServiceName(request.requestId);
            const amount = this.getServiceFee(request.requestId);
            const processedBy = this.getAccountName(request.accountId);
    
            return [date, recipient, details, amount, processedBy];
        });
    
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');
    
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
    
        const link = document.createElement('a');
        link.href = url;
        link.download = 'revenues.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    

    updateDisplayedRequest() {
        let filteredRequest = this.request;

        // If there is a search term, apply filtering
        if (this.searchRequest) {
            filteredRequest = filteredRequest.filter(request => {
                const requestDetail = this.requestDetails.find(rd => rd.requestId === request.requestId);

                if (requestDetail) {
                    const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);
                    
                    if (service) {
                        const serviceName = service.servicesName.toLowerCase();
                        const serviceFee = service.servicesFee.toString().toLowerCase();
                        const accountName = this.getAccountName(request.accountId).toLowerCase();

                        const matchesRequestFields =
                            request.requestName.toLowerCase().includes(this.searchRequest.toLowerCase());

                        const matchesServiceFields =
                            serviceName.includes(this.searchRequest.toLowerCase()) ||
                            serviceFee.includes(this.searchRequest.toLowerCase()) ||
                            accountName.includes(this.searchRequest.toLowerCase());

                        return matchesRequestFields || matchesServiceFields;
                    }
                }
                return false;
            });
        }

        // Apply minimum and maximum date filters
        if (this.minDate) {
            filteredRequest = filteredRequest.filter(request =>
                new Date(request.date) >= new Date(this.minDate)
            );
        }
        if (this.maxDate) {
            filteredRequest = filteredRequest.filter(request =>
                new Date(request.date) <= new Date(this.maxDate)
            );
        }    

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
        let valueA, valueB;

        if (this.sortColumn === 'servicesName') {
            valueA = this.getServiceName(a.requestId).toLowerCase();
            valueB = this.getServiceName(b.requestId).toLowerCase();
        } else if (this.sortColumn === 'servicesFee') {
            valueA = this.getServiceFee(a.requestId).toLowerCase();
            valueB = this.getServiceFee(b.requestId).toLowerCase();
        } else if (this.sortColumn === 'accountName') {
            valueA = this.getAccountName(a.accountId).toLowerCase();
            valueB = this.getAccountName(b.accountId).toLowerCase();
        } else {
            valueA = a[this.sortColumn].toLowerCase();
            valueB = b[this.sortColumn].toLowerCase();
        }

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

    // Handle minimum and maximum date changes
    onDateChange() {
        this.currentPage = 1; // Reset to first page
        this.updateDisplayedRequest();
    }

    onSearch() {
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

                if (newStatus === 3) { // Released
                    this.notificationService.removeReleasedNotification(requestId);
                }
                
                // Load pending and processed requests
                this.notificationService.loadRequests();
            },
            error: (error) => {
                console.error('Error updating status:', error);
                this.alertService.error('Failed to update request status.');
            }
        });
    }

    generateCertificate(requestId: string): void {
        this.requestService.generateCertificate(requestId).subscribe({
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

    getAccountName(accountId: number): string {
        const account = this.accounts.find(account => account.id === accountId);
        return account ? account.fullName : '.....';
    }

    getServiceName(requestId: string): string {
        const requestDetail = this.requestDetails.find(rd => rd.requestId === requestId);
        if (requestDetail) {
            const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);
            return service ? service.servicesName : 'Service not found';
        }
        return 'No details';
    }

    getServiceFee(requestId: string): string {
        const requestDetail = this.requestDetails.find(rd => rd.requestId === requestId);
        if (requestDetail) {
            const service = this.services.find(s => s.servicesId === +requestDetail.servicesId);
            return service ? service.servicesFee : 'Service Fee not found';
        }
        return 'No details';
    }
}
