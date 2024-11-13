import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Services } from '@app/_models';

const baseUrl = `${environment.apiUrl}/services`;

@Injectable({ providedIn: 'root' })
export class ServicesService {
    private servicesSubject: BehaviorSubject<Services>;
    public services: Observable<Services>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.servicesSubject = new BehaviorSubject<Services>(null);
        this.services = this.servicesSubject.asObservable();
    }

    public get servicesValue(): Services {
        return this.servicesSubject.value;
    }

    getAll() {
        return this.http.get<Services[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Services>(`${baseUrl}/${id}`);
    }

    createServices(params) {
        return this.http.post(baseUrl, params);
    }

    updateServices(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((services: any) => {
                if (this.servicesValue && services.servicesId === this.servicesValue.servicesId) {
                    services = { ...this.servicesValue, ...services };
                    this.servicesSubject.next(services);
                }
                return services;
            }))
    }

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}