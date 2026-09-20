import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { PageBannerComponent } from '../../core/page-banner/page-banner.component';
import { NotificationCardComponent } from './notification-card/notification-card.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, IonContent, PageBannerComponent, NotificationCardComponent, AnimateOnScrollDirective],
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss']
})
export class NotificationsPage implements OnInit {
  unreadCount = 0;
  notifications: any[] = [];
  isLoading = true;
  userEmail = '';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
    this.userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
    if (!this.userEmail) {
        this.isLoading = false;
        return;
    }

    try {
        const response = await fetch(`${environment.apiUrl}/notifications/${this.userEmail}`);
        if (response.ok) {
            const dbNotifs = await response.json();
            dbNotifs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            this.notifications = dbNotifs.map((n: any) => ({
                id: n._id,
                title: n.title,
                message: n.message,
                timeAgo: this.formatTimeAgo(n.createdAt), 
                icon: n.icon,
                iconColor: n.iconColor,
                isRead: n.isRead,
                hasPrimaryAction: n.hasPrimaryAction,
                primaryText: n.primaryText,
                hasSecondaryAction: n.hasSecondaryAction,
                secondaryText: n.secondaryText,
                type: n.type,
                groupId: n.groupId
            }));

            this.calculateUnread();
        }
    } catch (error) {
        console.error("Errore fetch notifiche", error);
    } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
  }

  formatTimeAgo(dateString: string): string {
    if (!dateString) return ''; 

    const date = new Date(dateString);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (diffMins < 1) return 'Appena ora';
    if (diffMins < 60) return `${diffMins} min fa`;

    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return `Oggi, ${hours}:${minutes}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
        return `Ieri, ${hours}:${minutes}`;
    }

    return `${diffDays} giorni fa`;
  }

  calculateUnread() {
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  async markAllAsRead() {
    if (this.unreadCount === 0) return;

    this.notifications.forEach(n => n.isRead = true);
    this.unreadCount = 0;
    this.cdr.detectChanges();

    try {
        await fetch(`${environment.apiUrl}/notifications/${this.userEmail}/read-all`, {
            method: 'PUT'
        });
    } catch (e) {
        console.error("Impossibile aggiornare il database");
    }
  }
  
  handleDeleteSingle(notifId: string) {
      this.notifications = this.notifications.filter(n => n.id !== notifId);
      this.calculateUnread();
  }
  
  async deleteAllNotifications() {
    if (this.notifications.length === 0) return;

    const confirmDelete = confirm("Sei sicuro di voler eliminare tutte le notifiche?");
    if (!confirmDelete) return;

    this.notifications = [];
    this.unreadCount = 0;
    this.cdr.detectChanges();

    try {
        await fetch(`${environment.apiUrl}/notifications/${this.userEmail}/delete-all`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error("Impossibile eliminare le notifiche dal database");
    }
  }
}