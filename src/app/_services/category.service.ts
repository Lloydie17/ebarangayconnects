import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Category } from '@app/_models';

const baseUrl = `${environment.apiUrl}/category`;

@Injectable({ providedIn: 'root' })
export class CategoryService {
    private categorySubject: BehaviorSubject<Category>;
    public category: Observable<Category>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.categorySubject = new BehaviorSubject<Category>(null);
        this.category = this.categorySubject.asObservable();
    }

    public get categoryValue(): Category {
        return this.categorySubject.value;
    }

    getAll() {
        return this.http.get<Category[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Category>(`${baseUrl}/${id}`);
    }

    createCategory(params) {
        return this.http.post(baseUrl, params);
    }

    updateCategory(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((category: any) => {
                if (this.categoryValue && category.categoryId === this.categoryValue.categoryId) {
                    category = { ...this.categoryValue, ...category};
                    this.categorySubject.next(category);
                }
                return category;
            }))
    }
    

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}