import { Component, ChangeDetectorRef, OnInit } from '@angular/core'; 
import { environment } from 'src/environments/environment';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive'; 
import { NavbarComponent } from '../../core/navbar/navbar.component'; 

@Component({
  selector: 'app-help',
  standalone: true,
  imports: [FormsModule, CommonModule, AnimateOnScrollDirective, RouterLink, IonContent, NavbarComponent], 
  templateUrl: './help.page.html',
  styleUrls: ['./help.page.scss']
})
export class HelpPage implements OnInit {
  username = '';
  email = '';
  titolo = '';
  descrizione = '';
  
  isSubmitting = false;
  showErrors = false;
  serverError = ''; 

  isSuccess = false;
  returnPath = '/';
  returnText = '← Torna alla Home';

  showAnimations = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email');
    
    if (userEmail) {
        this.returnPath = '/dashboard';
        this.returnText = '← Torna alla Dashboard';
    }
  }

  ionViewWillEnter() {
      this.showAnimations = false;
      setTimeout(() => this.showAnimations = true, 50);
  }

  ionViewWillLeave() {
      this.showAnimations = false;
  }

  isInvalid(field: string): boolean {
    if (!this.showErrors) return false;
    if (field === 'username') return !this.username.trim();
    if (field === 'email') return !this.email.trim();
    if (field === 'titolo') return !this.titolo.trim();
    if (field === 'descrizione') return !this.descrizione.trim();
    return false;
  }

  async onSubmit(event: Event) {
    event.preventDefault();

    this.showErrors = true;
    this.serverError = '';

    if (!this.username.trim() || !this.email.trim() || !this.titolo.trim() || !this.descrizione.trim()) {
        return;
    }

    if (this.isSubmitting) return;

    this.isSubmitting = true;
    this.cdr.detectChanges(); 

    try {
      const response = await fetch(`${environment.apiUrl}/support`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: this.username,
          email: this.email,
          titolo: this.titolo,
          descrizione: this.descrizione
        })
      });

      const data = await response.json();

      if (response.ok) {
        this.isSuccess = true; 
      } else {
        this.serverError = data.error || "Impossibile inviare la richiesta. Riprova.";
        this.isSubmitting = false;
      }
    } catch (error) {
      this.serverError = "Impossibile connettersi al server. Verifica la tua connessione.";
      this.isSubmitting = false; 
    } finally {
      this.cdr.detectChanges(); 
    }
  }
}