import { Component, OnInit } from '@angular/core';
import { filter, first } from 'rxjs/operators';
import { CategoryService, AlertService } from '@app/_services';
import { Category } from '@app/_models';

@Component({ templateUrl: 'list.component.html' })
export class ListComponent implements OnInit {
    categories: any[];
    displayedCategories: Category[] = [];
    searchCategory: string = '';
    currentPage: number = 1;
    totalEntries: number = 0;
    pageSize: number = 10; // Default entries per page
    pageSizes: number[] = [10, 25, 50];
    sortColumn: string = 'category';
    sortOrder: 'asc' | 'desc' = 'asc';

    constructor(
        private categoryService: CategoryService,
        private alertService: AlertService,
    ) {}

    ngOnInit() {
        this.categoryService.getAll()
            .pipe(first())
            .subscribe(categories => {
                this.categories = categories;
                this.totalEntries = this.categories.length;
                this.updateDisplayedCategories();
            });

    }

    // Update the displayed residents based on pagination and page size
    updateDisplayedCategories() {
        let filteredcategories = this.categories.filter(category =>
            category.category.toLowerCase().includes(this.searchCategory.toLowerCase())
        );

        filteredcategories = this.sortCategories(filteredcategories);

        this.totalEntries = filteredcategories.length;
        const startIndex = (this.currentPage - 1) * this.pageSize;
        const endIndex = Math.min(startIndex + this.pageSize, this.totalEntries);
        this.displayedCategories = filteredcategories.slice(startIndex, endIndex);
    }

    // Handle the page change
    changePage(page: number) {
        if (page >= 1 && page <= this.getTotalPages()) {
            this.currentPage = page;
            this.updateDisplayedCategories();
        }
    }

    sortCategories(categories) {
        return categories.sort((a, b) => {
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
        this.updateDisplayedCategories();
    }

    onSearch() {
        console.log('Search term:', this.searchCategory);
        this.currentPage = 1;
        this.updateDisplayedCategories();
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
        this.updateDisplayedCategories();
    }

    deleteCategory(categoryId: string) {
        const category = this.categories.find(cat => cat.categoryId === categoryId);
        category.isDeleting = true;
        this.categoryService.delete(categoryId)
            .pipe(first())
            .subscribe(() => {
                this.alertService.success('Category deleted successfully', { keepAfterRouteChange: true });
                this.categories = this.categories.filter(category => category.categoryId !== categoryId);
                this.totalEntries = this.categories.length;
                this.updateDisplayedCategories();
            });
    }
}
