import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Announcement } from '@app/_models';

const baseUrl = `${environment.apiUrl}/announcement`;

@Injectable({ providedIn: 'root' })
export class AnnouncementService {
    private announcementSubject: BehaviorSubject<Announcement>;
    public announcement: Observable<Announcement>;

    constructor(
        private router: Router,
        private http: HttpClient
    ) {
        this.announcementSubject = new BehaviorSubject<Announcement>(null);
        this.announcement = this.announcementSubject.asObservable();
    }

    public get announcementValue(): Announcement {
        return this.announcementSubject.value;
    }

    getNext(id: string) {
        return this.http.get<Announcement>(`${baseUrl}/${id}/next`);
    }

    getPrevious(id: string) {
        return this.http.get<Announcement>(`${baseUrl}/${id}/previous`);
    }

    getAll() {
        return this.http.get<Announcement[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Announcement>(`${baseUrl}/${id}`);
    }
    
    createAnnouncement(formData: FormData) {
        return this.http.post(baseUrl, formData);
    }
    
    updateAnnouncement(id, formData: FormData) {
        return this.http.put(`${baseUrl}/${id}`, formData)
            .pipe(map((announcement: any) => {
                if (this.announcementValue && announcement.announcementId === this.announcementValue.announcementId) {
                    announcement = { ...this.announcementValue, ...announcement };
                    this.announcementSubject.next(announcement);
                }
                return announcement;
            }));
    }    

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
    
}