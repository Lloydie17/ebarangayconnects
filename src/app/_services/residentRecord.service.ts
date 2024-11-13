import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { ResidentRecord } from '@app/_models';

const baseUrl = `${environment.apiUrl}/residentRecords`;

@Injectable({ providedIn: 'root' })
export class ResidentRecordService {
    private residentRecordSubject: BehaviorSubject<ResidentRecord>;
    public residentRecord: Observable<ResidentRecord>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.residentRecordSubject = new BehaviorSubject<ResidentRecord>(null);
        this.residentRecord = this.residentRecordSubject.asObservable();
    }

    public get residentRecordValue(): ResidentRecord {
        return this.residentRecordSubject.value;
    }

    getAllByResidentId(residentId: string) {
        return this.http.get<ResidentRecord[]>(`${baseUrl}/resident/${residentId}`);
    }

    getAll() {
        return this.http.get<ResidentRecord[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<ResidentRecord>(`${baseUrl}/${id}`);
    }
    
    createCertificate(params) {
        return this.http.post(baseUrl, params);
    }
    
    generateCertificate(residentId: string, certificatePurpose: string) {
        return this.http.post<any>(`${baseUrl}/generate`, { residentId, certificatePurpose });
    }
}