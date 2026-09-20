import { Component, HostListener, ElementRef, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-profile-dropdown',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './profile-dropdown.component.html',
  styleUrls: ['./profile-dropdown.component.scss']
})
export class ProfileDropdownComponent implements OnInit {
  isOpen = false;
  
  userName: string = 'Caricamento...';
  userEmail: string = '';
  userInitials: string = '...';
  userImageUrl: string | null = null;
  unreadCount = 0;

  constructor(
      private eRef: ElementRef, 
      private router: Router, 
      private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    this.userEmail = localStorage.getItem('smartgarden_user_email') || 
                     sessionStorage.getItem('smartgarden_user_email') || '';

    if (!this.userEmail) {
        this.router.navigate(['/auth/login']);
        return;
    }

    await Promise.all([this.loadProfileData(), this.updateUnreadCount()]);
    this.cdr.detectChanges();
  }

  async loadProfileData() {
    try {
        const response = await fetch(`${environment.apiUrl}/user/${this.userEmail}`);
        if (response.ok) {
            const data = await response.json();
            this.userName = data.username || 'Utente';
            this.userImageUrl = data.avatar?.url || data.imageUrl || null;
            this.userInitials = this.userName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
        }
    } catch (error) {
        console.error("Errore recupero profilo:", error);
    }
  }

  async updateUnreadCount() {
    if (!this.userEmail) return;
    try {
        const res = await fetch(`${environment.apiUrl}/unread-count/${this.userEmail}`);
        if (res.ok) {
            const data = await res.json();
            this.unreadCount = data.count;
            this.cdr.detectChanges(); 
        }
    } catch (e) {
        console.error("Errore conteggio notifiche:", e);
    }
  }

  toggleMenu() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) this.updateUnreadCount();
  }

  @HostListener('document:click', ['$event'])
  clickout(event: Event) {
    if (!this.eRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  async logout(event: Event) {
    event.preventDefault(); 
    if (this.userEmail) {
        try {
            await fetch(`${environment.apiUrl}/user/offline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: this.userEmail })
            });
        } catch (e) {
            console.error("Errore logout server");
        }
    }
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigate(['/auth/login']);
  }
}