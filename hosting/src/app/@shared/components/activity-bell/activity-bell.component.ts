import { Component, OnInit } from '@angular/core';
import { PendingActivitiesService } from '@shared/services/pending-activities.service';

@Component({
    selector: 'activity-bell',
    templateUrl: './activity-bell.component.html',
    styleUrls: ['./activity-bell.component.scss']
})
export class ActivityBellComponent implements OnInit {
    public pendingActivities: any[] = [];
    public showList = false;

    constructor(private pendingService: PendingActivitiesService) { }

    ngOnInit(): void {
        this.pendingService.pendingActivities$.subscribe((acts) => {
            this.pendingActivities = acts;
        });
    }

    toggleList(): void {
        this.showList = !this.showList;
    }

    view(activityId: string): void {
        // A lista não remove a atividade ao visualizar
        this.showList = false;
    }
}