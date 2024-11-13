import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Request } from '@app/_models';

const baseUrl = `${environment.apiUrl}/requests`;

@Injectable({ providedIn: 'root' })
export class RequestService {
    private requestSubject: BehaviorSubject<Request>;
    public request: Observable<Request>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.requestSubject = new BehaviorSubject<Request>(null);
        this.request = this.requestSubject.asObservable();
    }

    public get requestValue(): Request {
        return this.requestSubject.value;
    }

    getAll() {
        return this.http.get<Request[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Request>(`${baseUrl}/${id}`);
    }

    createRequest(request: any): Observable<Request> {
        return this.http.post<Request>(baseUrl, request);
    }

    updateRequest(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((request: any) => {
                if (this.requestValue && request.requestId === this.requestValue.requestId) {
                    request = { ...this.requestValue, ...request };
                    this.requestSubject.next(request);
                }
                return request;
            }))
    }

    updateStatus(id, newStatus) {
        return this.http.put(`${baseUrl}/updateStatus/${id}`, newStatus);
    }

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }

    generateCertificate(requestId: string): Observable<any> {
        return this.http.put(`${baseUrl}/certificate/${requestId}`, {}, { responseType: 'text' });
    }

    generatePermit(requestId: string): Observable<any> {
        return this.http.put(`${baseUrl}/permit/${requestId}`, {}, { responseType: 'text' });
    }
}