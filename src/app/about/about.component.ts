import { Component } from '@angular/core';
import { first } from 'rxjs/operators';
import { BarangayService, AccountService } from '@app/_services';
import { Router } from '@angular/router';
import { Barangay } from '@app/_models';

import * as L from 'leaflet';

@Component({ templateUrl: 'about.component.html'})

export class AboutComponent {
    account = this.accountService.accountValue;
    barangay: any[];
    map: L.Map;
    marker: L.Marker;
    satelliteLayer: L.TileLayer;
    streetLayer: L.TileLayer;
    barangayLayer: L.GeoJSON;
    userMarker: L.Marker;
    initialLatLng: L.LatLng;
    bounceInterval: any;

    constructor(
        private barangayService: BarangayService,
        private accountService: AccountService,
        private router: Router,
    ) { }

    ngOnInit() {
        this.barangayService.getAll()
            .pipe(first())
            .subscribe(barangay => this.barangay = barangay)
    }
}