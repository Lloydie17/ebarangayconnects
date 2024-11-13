import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Sitio } from '@app/_models';

const baseUrl = `${environment.apiUrl}/sitio`;

@Injectable({ providedIn: 'root' })
export class SitioService {
    private sitioSubject: BehaviorSubject<Sitio>;
    public sitio: Observable<Sitio>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.sitioSubject = new BehaviorSubject<Sitio>(null);
        this.sitio = this.sitioSubject.asObservable();
    }

    public get sitioValue(): Sitio {
        return this.sitioSubject.value;
    }

    getAll() {
        return this.http.get<Sitio[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Sitio>(`${baseUrl}/${id}`);
    }

    createSitio(params) {
        return this.http.post(baseUrl, params);
    }

    updateSitio(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((sitio: any) => {
                if (this.sitioValue && sitio.sitioId === this.sitioValue.sitioId) {
                    sitio = { ...this.sitioValue, ...sitio };
                    this.sitioSubject.next(sitio);
                }
                return sitio;
            }))
    }

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}