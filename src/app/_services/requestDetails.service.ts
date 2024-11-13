import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { RequestDetails } from '@app/_models';

const baseUrl = `${environment.apiUrl}/requestDetails`;

@Injectable({ providedIn: 'root' })
export class RequestDetailsService {
    private requestDetailsSubject: BehaviorSubject<RequestDetails>;
    public requestDetails: Observable<RequestDetails>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.requestDetailsSubject = new BehaviorSubject<RequestDetails>(null);
        this.requestDetails = this.requestDetailsSubject.asObservable();
    }

    public get requestDetailsValue(): RequestDetails {
        return this.requestDetailsSubject.value;
    }

    getAll() {
        return this.http.get<RequestDetails[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<RequestDetails>(`${baseUrl}/${id}`);
    }

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}