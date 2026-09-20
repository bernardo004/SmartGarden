import { Component, HostListener, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [IonApp, IonRouterOutlet],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit {

  ngOnInit() {
    this.checkAndSetOnline();
    this.startHeartbeat();

    if (Capacitor.getPlatform() !== 'web') {
      CapacitorApp.addListener('appStateChange', (state) => {
        if (state.isActive) {
          this.checkAndSetOnline();
        } else {
          this.setOffline();
        }
      });
    }

    if (Capacitor.getPlatform() === 'web') {
      const userEmail = this.getUserEmail();
      if (userEmail) {
        let tabCount = parseInt(localStorage.getItem('smartgarden_tab_count') || '0', 10);
        if (isNaN(tabCount) || tabCount < 0) tabCount = 0;
        tabCount++;
        localStorage.setItem('smartgarden_tab_count', tabCount.toString());
      }
    }
  }

  @HostListener('window:beforeunload', ['$event'])
  unloadNotification($event: any) {
    if (Capacitor.getPlatform() === 'web') {
      this.setOffline();
    }
  }


  private getUserEmail(): string | null {
    return localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email');
  }

  private checkAndSetOnline() {
    const userEmail = this.getUserEmail();
    if (userEmail) {
      fetch(`${environment.apiUrl}/user/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail })
      }).catch(err => console.error('Errore Online:', err));
    }
  }

  private setOffline() {
    const userEmail = this.getUserEmail();
    if (userEmail) {
      fetch(`${environment.apiUrl}/user/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: userEmail }),
        keepalive: true
      }).catch(err => console.error('Errore Offline:', err));
    }
  }

  private startHeartbeat() {
    setInterval(() => {
      const userEmail = this.getUserEmail();
      if (userEmail) {
        fetch(`${environment.apiUrl}/user/${userEmail}/heartbeat`, {
          method: 'PUT'
        }).catch(err => console.error('Errore Heartbeat:', err));
      }
    }, 60000);
  }
}
