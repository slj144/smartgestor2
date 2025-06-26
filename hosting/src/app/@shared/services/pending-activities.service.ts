import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CrmService } from '@pages/crm/crm.service';

@Injectable({ providedIn: 'root' })
export class PendingActivitiesService {
    private pendingSubject = new BehaviorSubject<any[]>([]);
    public pendingActivities$ = this.pendingSubject.asObservable();

    private viewedIds: Set<string> = new Set(
        JSON.parse(localStorage.getItem('viewedActivities') || '[]')
    );

    constructor(private crmService: CrmService) {
        this.crmService.activities$.subscribe((activities) => {
            this.updatePending(activities);
        });
    }

    private updatePending(activities: any[]): void {
        const pending = activities.filter(
            (a) =>
                (a.status === 'pending' || a.status === 'overdue') &&
                !this.viewedIds.has(a._id)
        );
        this.pendingSubject.next(pending);
    }

    public markAsViewed(activityId: string): void {
        this.viewedIds.add(activityId);
        localStorage.setItem(
            'viewedActivities',
            JSON.stringify(Array.from(this.viewedIds))
        );
        const current = this.pendingSubject
            .getValue()
            .filter((a) => a._id !== activityId);
        this.pendingSubject.next(current);
    }
}