import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.page.html',
  styleUrls: ['./forgot-password.page.scss']
})
export class ForgotPasswordPage {

  step: 'request' | 'verify' | 'success' = 'request';

  email = '';
  otp = '';
  newPassword = '';
  confirmPassword = '';

  isSubmitting = false;
  showErrors = false;

  isInvalid(): boolean {
    return this.showErrors && !this.email.trim();
  }

  async sendOTP() {
    this.showErrors = true;
    if (!this.email.trim()) return;

    this.isSubmitting = true;
    try {
      const response = await fetch(`${environment.apiUrl}/auth/request-password-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: this.email })
      });

      if (response.ok) {
        this.step = 'verify';
      } else {
        alert("Errore nell'invio dell'email. Controlla l'indirizzo.");
      }
    } catch (error) {
      console.error(error);
      alert("Errore di connessione al server.");
    } finally {
      this.isSubmitting = false;
    }
  }

  async verifyAndReset() {
    if (this.newPassword !== this.confirmPassword) {
      alert("Le password non coincidono!");
      return;
    }

    this.isSubmitting = true;
    try {
      const response = await fetch(`${environment.apiUrl}/auth/verify-and-reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: this.email,
          otp: this.otp,
          newPassword: this.newPassword
        })
      });

      if (response.ok) {
        this.step = 'success';
      } else {
        alert("Codice OTP errato o scaduto.");
      }
    } catch (error) {
      console.error(error);
      alert("Errore durante il reset della password.");
    } finally {
      this.isSubmitting = false;
    }
  }

  onSubmit(event: Event) {
    event.preventDefault();
    if (this.step === 'request') {
      this.sendOTP();
    } else if (this.step === 'verify') {
      this.verifyAndReset();
    }
  }
}
