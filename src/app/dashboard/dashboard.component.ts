import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { ResidentService, RequestService, RequestDetailsService, ServicesService  } from '@app/_services';  // Adjust the path if needed
import { Resident, Request, RequestDetails, Services } from '@app/_models';  // Adjust the path if needed

@Component({ templateUrl: 'dashboard.component.html'})

export class DashboardComponent implements OnInit {
    residents: any[];
    totalPopulation: number = 0;
    totalVoters: number = 0;
    totalNonVoters: number = 0;
    totalMale: number = 0;
    totalFemale: number = 0;
    totalRevenue: number = 0;
    requestDetails: RequestDetails[] = [];
    services: Services[] = [];
    request: Request[] = [];

    constructor(
        private residentService: ResidentService,
        private requestService: RequestService,
        private requestDetailsService: RequestDetailsService,
        private servicesService: ServicesService,
    ) {}

    ngOnInit() {
        this.getTotalPopulation();
        this.getTotalVoters();
        this.getTotalNonVoters();
        this.getTotalMale();
        this.getTotalFemale();
        this.getTotalRevenue();
    }

    // Fetch residents and count those with status = true
    getTotalPopulation() {
        this.residentService.getAll().subscribe(residents => {
            this.totalPopulation = residents.filter(resident => resident.status && resident.dump).length;
        },
        error => {
            console.error('Error fetching residents:', error);
            this.totalPopulation = 0;  // Set to 0 in case of error
        });
    }

    getTotalVoters() {
        this.residentService.getAll().subscribe(residents => {
            this.totalVoters = residents.filter(resident => resident.isVoter && resident.dump).length;
        },
        error => {
            this.totalVoters = 0;
        });
    }

    getTotalNonVoters() {
        this.residentService.getAll().subscribe(residents => {
            this.totalNonVoters = residents.filter(resident => !resident.isVoter && resident.dump).length;
        },
        error => {
            this.totalNonVoters = 0;
        });
    }

    getTotalMale() {
        this.residentService.getAll().subscribe(residents => {
            this.totalMale = residents.filter(resident => resident.gender === 'Male' && resident.dump).length;
        },
        error => {
            this.totalMale = 0;
        });
    }

    getTotalFemale() {
        this.residentService.getAll().subscribe(residents => {
            this.totalFemale = residents.filter(resident => resident.gender === 'Female' && resident.dump).length;
        },
        error => {
            this.totalFemale = 0;
        });
    }

    getTotalRevenue() {
        this.requestService.getAll()
            .pipe(first())
            .subscribe(requests => {
                this.request = requests;
    
                this.requestDetailsService.getAll()
                    .pipe(first())
                    .subscribe(requestDetails => {
                        this.requestDetails = requestDetails; 
                        
                        this.totalRevenue = requestDetails.reduce((total, requestDetail) => {
                            const request = requests.find(req => req.requestId === requestDetail.requestId);
                            
                            if (request && request.status === 3) {
                                return total + (parseFloat(requestDetail.servicesFee) || 0);
                            }
                            return total;
                        }, 0);
                    },
                    error => {
                        console.error('Error fetching request details:', error);
                        this.totalRevenue = 0; 
                    });
            },
            error => {
                console.error('Error fetching requests:', error);
                this.totalRevenue = 0; 
            });
    }
}