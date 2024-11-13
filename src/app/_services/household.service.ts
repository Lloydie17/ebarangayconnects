import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Household } from '@app/_models';

const baseUrl = `${environment.apiUrl}/households`;

@Injectable({ providedIn: 'root' })
export class HouseholdService {
    private householdSubject: BehaviorSubject<Household>;
    public household: Observable<Household>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.householdSubject = new BehaviorSubject<Household>(null);
        this.household = this.householdSubject.asObservable();
    }

    public get householdValue(): Household {
        return this.householdSubject.value;
    }

    getAll() {
        return this.http.get<Household[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Household>(`${baseUrl}/${id}`);
    }

    createHousehold(params) {
        return this.http.post(baseUrl, params);
    }

    updateHousehold(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((household: any) => {
                if(this.householdValue && household.householdId === this.householdValue.householdId) {
                    household = { ...this.householdValue, ...household };
                    this.householdSubject.next(household);
                }
                return household;
            }))
    }
    

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}