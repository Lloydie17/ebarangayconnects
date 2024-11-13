import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Resident } from '@app/_models';

const baseUrl = `${environment.apiUrl}/residents`;

@Injectable({ providedIn: 'root' })
export class ResidentService {
    private residentSubject: BehaviorSubject<Resident>;
    public resident: Observable<Resident>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.residentSubject = new BehaviorSubject<Resident>(null);
        this.resident = this.residentSubject.asObservable();
    }

    public get residentValue(): Resident {
        return this.residentSubject.value;
    }

    getAll() {
        return this.http.get<Resident[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Resident>(`${baseUrl}/${id}`);
    }

    registerResident(resident: FormData) {
        return this.http.post(`${baseUrl}/register`, resident, {
            headers: {
                // 'Content-Type': 'multipart/form-data' will automatically be set by the browser when using FormData
            }
        });
    }
    
    createResident(params) {
        return this.http.post(baseUrl, params);
    }
    
    updateResident(id, formData: FormData) {
        return this.http.put(`${baseUrl}/${id}`, formData)
            .pipe(map((resident: any) => {
                if (this.residentValue && resident.id === this.residentValue.id) {
                    resident = { ...this.residentValue, ...resident };
                    this.residentSubject.next(resident);
                }
                return resident;
            }));
    }

    verifyResident(id: string) {
        return this.http.put(`${baseUrl}/approve/${id}`, {});
    }

    deleteResident(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }

    getResidentLocation(firstName: string): Observable<any> {
        return this.http.get<any>(`${baseUrl}/location/${firstName}`);
    }
    

}