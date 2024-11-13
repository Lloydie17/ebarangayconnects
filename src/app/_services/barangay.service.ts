import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Barangay } from '@app/_models';

const baseUrl = `${environment.apiUrl}/barangay`;

@Injectable({ providedIn: 'root' })
export class BarangayService {
    private barangaySubject: BehaviorSubject<Barangay>;
    public barangay: Observable<Barangay>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.barangaySubject = new BehaviorSubject<Barangay>(null);
        this.barangay = this.barangaySubject.asObservable();
    }

    public get barangayValue(): Barangay {
        return this.barangaySubject.value;
    }

    getAll() {
        return this.http.get<Barangay[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Barangay>(`${baseUrl}/${id}`);
    }
    
    createBarangay(params) {
        return this.http.post(baseUrl, params);
    }
    
    updateBarangay(id, formData: FormData) {
        return this.http.put(`${baseUrl}/${id}`, formData)
            .pipe(map((barangay: any) => {
                if (this.barangayValue && barangay.barangayId === this.barangayValue.barangayId) {
                    barangay = { ...this.barangayValue, ...barangay };
                    this.barangaySubject.next(barangay);
                }
                return barangay;
            }));
    }    

}