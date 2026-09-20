import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-notification-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-card.component.html',
  styleUrls: ['./notification-card.component.scss']
})
export class NotificationCardComponent {
  @Input() data: any;
  
  @Output() deleteEvent = new EventEmitter<string>();

  constructor(private cdr: ChangeDetectorRef) {}

  async handleAction(actionType: 'accept' | 'decline') {
      if (this.data.type !== 'group_invite') return; 

      const userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email');
      
      this.data.isRead = true;
      this.data.hasPrimaryAction = false;
      this.data.hasSecondaryAction = false;
      this.data.message = actionType === 'accept' ? 'Accettazione in corso...' : 'Rifiutato.';
      this.cdr.detectChanges();

      try {
          const response = await fetch(`${environment.apiUrl}/notifications/action`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  notificationId: this.data.id,
                  action: actionType,
                  userEmail: userEmail,
                  groupId: this.data.groupId
              })
          });

          if (response.ok) {
              const result = await response.json();
              this.data.message = result.message; 
              this.cdr.detectChanges();
          }
      } catch (error) {
          console.error("Errore durante l'azione:", error);
          this.data.message = "Errore di connessione. Riprova più tardi.";
      }
  }

  async markAsRead() {
    this.data.isRead = true; 
    this.cdr.detectChanges(); 
    try {
        await fetch(`${environment.apiUrl}/notifications/single/${this.data.id}/read`, { 
            method: 'PUT' 
        });
    } catch (error) { 
        console.error("Errore connessione server"); 
    }
  }
  
  async deleteNotification() {
    this.deleteEvent.emit(this.data.id); 

    try {
        await fetch(`${environment.apiUrl}/notifications/single/${this.data.id}`, { 
            method: 'DELETE' 
        });
    } catch (error) { 
        console.error("Errore eliminazione notifica dal server"); 
    }
  }
}