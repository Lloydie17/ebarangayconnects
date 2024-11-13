import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, finalize } from 'rxjs/operators';

import { environment } from '@environments/environment';
import { Project } from '@app/_models';
import { AccountService } from '@app/_services';

const baseUrl = `${environment.apiUrl}/projects`;

@Injectable({ providedIn: 'root' })
export class ProjectService {
    private projectSubject: BehaviorSubject<Project>;
    public project: Observable<Project>;

    constructor(
        private router: Router,
        private http: HttpClient,
        private accountService: AccountService
    ) {
        this.projectSubject = new BehaviorSubject<Project>(null);
        this.project = this.projectSubject.asObservable();
    }

    public get projectValue(): Project {
        return this.projectSubject.value;
    }

    getAll() {
        return this.http.get<Project[]>(baseUrl)
    }

    getById(id: string) {
        return this.http.get<Project>(`${baseUrl}/${id}`);
    }

    createProject(params) {
        const accountId = this.accountService.accountValue.id;
        const projectParams = { ...params, accountId };
        
        return this.http.post(baseUrl, projectParams);
    }

    updateProject(id, params) {
        return this.http.put(`${baseUrl}/${id}`, params)
            .pipe(map((project: any) => {
                if (this.projectValue && project.projectId === this.projectValue.projectId) {
                    project = { ...this.projectValue, ...project };
                    this.projectSubject.next(project);
                }
                return project;
            }))
    }

    delete(id: string) {
        return this.http.delete(`${baseUrl}/${id}`);
    }
}