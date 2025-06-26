import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { CrmService } from '@pages/crm/crm.service';
import { NotificationService } from './notification.service';
import { ENotificationStatus } from '../interfaces/ISystemNotification';

@Injectable({ providedIn: 'root' })
export class PendingActivitiesService {
    private pendingSubject = new BehaviorSubject<any[]>([]);
    public pendingActivities$ = this.pendingSubject.asObservable();

    // Guarda os IDs já notificados para evitar toasts duplicados
    private notifiedIds = new Set<string>();


    constructor(
        private crmService: CrmService,
        private notificationService: NotificationService
    ) {
        this.crmService.activities$.subscribe((activities) => {
            this.updatePending(activities);
        });
    }

    private updatePending(activities: any[]): void {
        const pending = activities.filter(
            (a) => a.status === 'pending' || a.status === 'overdue'
        );
        // Notificar novas atividades pendentes
        pending.forEach((act) => {
            if (!this.notifiedIds.has(act._id)) {
                this.notificationService.create({
                    title: 'Atividade pendente',
                    description: act.title,
                    status: ENotificationStatus.info,
                });
                this.notifiedIds.add(act._id);
            }
        });

        // Remover IDs de atividades concluídas do registro de notificações
        const pendingIds = new Set(pending.map((p) => p._id));
        this.notifiedIds.forEach((id) => {
            if (!pendingIds.has(id)) {
                this.notifiedIds.delete(id);
            }
        });

        this.pendingSubject.next(pending);
    }
    // A notificação permanece até que a atividade seja concluída

    public markAsViewed(activityId: string): void {

    }
}