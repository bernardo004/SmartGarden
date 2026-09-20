import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  email = '';
  password = '';
  rememberMe = false;
  isSubmitting = false;
  
  showErrors = false;
  serverError = '';

  constructor(private router: Router) {}

  isInvalid(field: string): boolean {
    if (!this.showErrors) return false;
    if (field === 'email') return !this.email.trim();
    if (field === 'password') return !this.password.trim();
    return false;
  }

  async onLogin(event: Event) {
    event.preventDefault();
    this.showErrors = true;
    this.serverError = '';

    if (!this.email.trim() || !this.password.trim()) {
      return;
    }

    this.isSubmitting = true;

    try {
      const response = await fetch(`${environment.apiUrl}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email, password: this.password })
      });

      const data = await response.json();
      this.isSubmitting = false;

      if (response.ok) {
        if (this.rememberMe) {
          localStorage.setItem('smartgarden_logged_in', 'true');
          localStorage.setItem('smartgarden_user_email', data.email || this.email);
		  localStorage.setItem('smartgarden_username', data.username);
        } else {
          sessionStorage.setItem('smartgarden_logged_in', 'true');
          sessionStorage.setItem('smartgarden_user_email', data.email || this.email);
		  sessionStorage.setItem('smartgarden_username', data.username);
          localStorage.removeItem('smartgarden_logged_in'); 
        }

        this.router.navigate(['/dashboard']); 
      } else {
        this.serverError = data.error || "Credenziali non valide. Riprova.";
      }

    } catch (error) {
      this.isSubmitting = false;
      this.serverError = "Impossibile connettersi al server. Verifica la connessione.";
    }
  }
}