import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { RequestService } from '@app/_services';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSource = new BehaviorSubject<any[]>([]);
  notifications$ = this.notificationsSource.asObservable();

  constructor(private requestService: RequestService) {}

  // Unified method to load both pending and processed requests
  loadRequests() {
    this.requestService.getAll().subscribe(requests => {
      const pendingRequests = requests.filter(request => request.status === 1);
      const processedRequests = requests.filter(request => request.status === 2);

      const notifications = [
        ...pendingRequests.map(request => ({
          id: request.requestId,
          name: request.requestName,
          message: 'has pending request: ',
          createdAt: request.createdAt,
          seen: false
        })),
        ...processedRequests.map(request => ({
          id: request.requestId,
          name: request.requestName,
          message: 'has been processed.',
          createdAt: request.updatedAt,
          seen: false
        }))
      ];

      this.updateNotifications(notifications);
    });
  }

  private updateNotifications(newNotifications: any[]) {
    const currentNotifications = this.notificationsSource.getValue();

    // Create a Set of existing notification IDs
    const existingNotificationIds = new Set(currentNotifications.map(n => n.id));

    // Filter new notifications to exclude duplicates
    const mergedNotifications = newNotifications.map(newNotification => {
      const existingNotification = currentNotifications.find(n => n.id === newNotification.id);
      if (existingNotification) {
        // If the notification exists, update its message and timestamp
        return { ...existingNotification, ...newNotification };
      }
      return newNotification;
    });

    // Update the notifications source
    this.notificationsSource.next(mergedNotifications);
  }

  markAsSeen(id: number) {
    const notifications = this.notificationsSource.getValue();
    const notification = notifications.find(n => n.id === id);
    if (notification) {
      notification.seen = true;
      this.notificationsSource.next(notifications);
    }
  }

  removeReleasedNotification(requestId: string) {
    const currentNotifications = this.notificationsSource.getValue();
    const filteredNotifications = currentNotifications.filter(n => n.id !== requestId);
    this.notificationsSource.next(filteredNotifications);
  }
}
