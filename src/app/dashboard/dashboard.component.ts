import { AfterViewInit, Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { Chart } from 'chart.js'; // Import Chart.js
import { ResidentService, RequestService, RequestDetailsService, ServicesService, ProjectService, SitioService, CategoryService } from '@app/_services'; 
import { Resident, Request, RequestDetails, Services, Project, Sitio } from '@app/_models'; 

@Component({ templateUrl: 'dashboard.component.html' })
export class DashboardComponent implements OnInit, AfterViewInit {
    residents: any[] = [];
    categories: any[] = [];
    totalPopulation: number = 0;
    totalVoters: number = 0;
    totalNonVoters: number = 0;
    totalMale: number = 0;
    totalFemale: number = 0;
    totalRevenue: number = 0;
    totalProjects: number = 0;
    totalSitio: number = 0;
    requestDetails: RequestDetails[] = [];
    services: Services[] = [];
    request: Request[] = [];
    projects: Project[] = [];
    sitio: Sitio[] = [];
    documentRequestsByMonthAndStatus: any = {};
    categoriesCount: { [key: string]: number } = {};
    revenueByMonth = {};

    dataLoaded: boolean = false;

    constructor(
        private residentService: ResidentService,
        private requestService: RequestService,
        private requestDetailsService: RequestDetailsService,
        private categoryService: CategoryService,
        private projectService: ProjectService,
        private sitioService: SitioService,
    ) {}

    ngAfterViewInit() {
        if (this.dataLoaded) {
            this.initializeGenderChart();
            this.initializeVoterChart();
            this.initializeRequestChart();
            this.initializeRevenueChart();
            this.initializeCategoryChart();
        }
    }

    ngOnInit() {
        this.getTotalPopulation();
        this.getTotalRevenue();
        this.getTotalProjects();
        this.getTotalSitio();
        this.getTotalMaleAndFemale();
        this.getTotalVotersAndNonVoters();
        this.getRequestsData();
        this.getMonthlyRevenue();
        this.getResidentsByCategory();
        this.getCategories()
    }

    getCategories() {
        this.categoryService.getAll().subscribe(
            (categoryData) => {
                this.categories = categoryData;
                this.checkDataLoaded();
            },
            (error) => {
                console.error('Error fetching categories:', error);
                this.checkDataLoaded();
            }
        );
    }

    getCategoryType(categoryId: number): string {
        const category = this.categories.find(category => category.categoryId === categoryId);
        return category ? category.category : 'Unknown Category';
    }

    getTotalPopulation() {
        this.residentService.getAll().subscribe(residents => {
            this.totalPopulation = residents.filter(resident => resident.status && resident.dump).length;
            this.checkDataLoaded();
        },
        error => {
            console.error('Error fetching residents:', error);
            this.checkDataLoaded();
            this.totalPopulation = 0;
        });
    }

    getTotalMaleAndFemale() {
        this.residentService.getAll().subscribe(
            (residents) => {
                this.totalMale = residents.filter((resident) => resident.gender === 'Male' && resident.dump).length;
                this.totalFemale = residents.filter((resident) => resident.gender === 'Female' && resident.dump).length;

                this.checkDataLoaded();
            },
            (error) => {
                console.error('Error fetching residents:', error);
                this.checkDataLoaded();
            }
        );
    }

    getTotalVotersAndNonVoters() {
        this.residentService.getAll().subscribe(
            (residents) => {
                this.totalVoters = residents.filter((resident) => resident.isVoter && resident.dump).length;
                this.totalNonVoters = residents.filter((resident) => !resident.isVoter && resident.dump).length;

                this.checkDataLoaded();
            },
            (error) => {
                console.error('Error fetching residents:', error);
                this.checkDataLoaded();
            }
        );
    }

    getRequestsData() {
        this.requestService.getAll().pipe(first()).subscribe(requests => {
            this.request = requests;
            this.getRequestsByMonthAndStatus();
            this.checkDataLoaded();
        });
    }

    getRequestsByMonthAndStatus() {
        const requestByMonth = {};

        this.request.forEach(req => {
            const month = new Date(req.date).toLocaleString('default', { month: 'long', year: 'numeric' });
            const status = req.status;

            if (!requestByMonth[month]) {
                requestByMonth[month] = { 3: 0 };
            }

            if (status === 3) {
                requestByMonth[month][status]++;
            }
        });

        this.documentRequestsByMonthAndStatus = requestByMonth;
    }

    getTotalProjects() {
        this.projectService.getAll().subscribe(projects => {
            this.totalProjects = projects.filter(project => Number(project.projectStatus) === 3 || Number(project.projectStatus) === 4).length;
        
            this.checkDataLoaded();
        },
        error => {
            this.totalProjects = 0;
            this.checkDataLoaded();
        });
    }

    getTotalSitio() {
        this.sitioService.getAll().subscribe(sitio => {
            this.totalSitio = sitio.filter(sitio => sitio).length;

            this.checkDataLoaded();
        },
        error => {
            this.totalSitio = 0;
            this.checkDataLoaded();
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

                        this.checkDataLoaded();
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

    getMonthlyRevenue() {
        this.requestDetails.forEach((detail) => {
            const request = this.request.find((req) => req.requestId === detail.requestId);
    
            if (request && request.status === 3) {
                const month = new Date(request.date).toLocaleString('default', { month: 'long', year: 'numeric' });
    
                if (!this.revenueByMonth[month]) {
                    this.revenueByMonth[month] = 0;
                }
    
                this.revenueByMonth[month] += parseFloat(detail.servicesFee) || 0;
            }
        });
        
        return this.revenueByMonth;
    }

    getResidentsByCategory() {
        this.residentService.getResidentsGroupedByCategory().subscribe(
            (categoryData) => {
                this.categoriesCount = categoryData;
                this.checkDataLoaded();
            },
            (error) => {
                this.checkDataLoaded();
                console.error('Error fetching residents by category:', error);
            }
        );
    }

    // Check if all data has been loaded and then initialize the chart
    checkDataLoaded() {
        const allDataLoaded = this.totalMale && this.totalFemale && this.totalVoters && this.totalNonVoters && this.categoriesCount && Object.keys(this.categoriesCount).length > 0;
        if (allDataLoaded) {
            this.dataLoaded = true;
            this.initializeGenderChart();
            this.initializeVoterChart();
            this.initializeRequestChart();
            this.initializeRevenueChart();
            this.initializeCategoryChart();
        }
    }
    

    // Initialize the pie chart using Chart.js
    initializeGenderChart() {
        const genderChartCtx  = document.getElementById('genderChart') as HTMLCanvasElement;
        new Chart(genderChartCtx , {
            type: 'pie',
            data: {
                labels: ['Male', 'Female'],
                datasets: [{
                    data: [this.totalMale, this.totalFemale],
                    backgroundColor: ['#36A2EB', '#FF6384'],
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
            },
        });
    }

    initializeVoterChart() {
        const voterChartCtx = document.getElementById('voterChart') as HTMLCanvasElement;
        new Chart(voterChartCtx, {
            type: 'pie',
            data: {
                labels: ['Voters', 'Non-Voters'],
                datasets: [{
                    data: [this.totalVoters, this.totalNonVoters],
                    backgroundColor: ['#4BC0C0', '#FF9F40'],
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
            },
        });
    }

    initializeRequestChart() {

        const months = Object.keys(this.documentRequestsByMonthAndStatus);
        const statusLabels = ['Released'];

        const statusData = statusLabels.map((status, index) => {
            return months.map(month => this.documentRequestsByMonthAndStatus[month][3] || 0);
        });

        const requestCtx = document.getElementById('documentRequestsChart') as HTMLCanvasElement;
        new Chart(requestCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: statusData.map((data, index) => ({
                    label: statusLabels[index],
                    data: data,
                    backgroundColor: ['#F8AE54'][index],
                    borderColor: ['#F8AE54'][index],
                    borderWidth: 1
                }))
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

    }

    initializeRevenueChart() {

        const monthlyRevenue = this.getMonthlyRevenue();
        const months = Object.keys(monthlyRevenue);
        const revenueData = Object.values(monthlyRevenue);

        const revenueChartCtx = document.getElementById('monthlyRevenueChart') as HTMLCanvasElement;
        new Chart(revenueChartCtx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue (₱)',
                    data: revenueData,
                    backgroundColor: '#4C7766',
                    borderColor: '#4CAF50',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue (₱)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        position: 'top'
                    }
                }
            }
        });

    }

    initializeCategoryChart() {
        const categoryChartCtx = document.getElementById('categoryChart') as HTMLCanvasElement;
        
        const categoryColors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#FF9F40'];
        const categoryLabels = Object.keys(this.categoriesCount).map(categoryId => this.getCategoryType(Number(categoryId))); // Map categoryIds to category names
        const categoryData = Object.values(this.categoriesCount);
    
        const colors = categoryLabels.map((_, index) => categoryColors[index % categoryColors.length]);
    
        new Chart(categoryChartCtx, {
            type: 'pie',
            data: {
                labels: categoryLabels,
                datasets: [{
                    data: categoryData,
                    backgroundColor: colors,
                }],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                },
            },
        });
    }
    
}
