import { Component } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'] 
})
export class RegisterPage {
  name = '';
  email = '';
  password = '';
  confirmPassword = '';
  isSubmitting = false;

  passwordStrengthText = '';
  passwordStrengthClass = '';
  
  showErrors = false;
  serverError = ''; 
  successMessage = '';

  constructor(private router: Router) {}

  checkPasswordStrength() {
    const val = this.password;
    let punteggio = 0;

    if (val.length === 0) {
        this.passwordStrengthText = '';
        this.passwordStrengthClass = '';
        return;
    }

    if (val.length >= 8) punteggio += 1;                  
    if (val.length >= 16) punteggio += 1;
    if (val.length >= 24) punteggio += 2;
    if (val.length >= 32) punteggio += 2;                 
    if (val.match(/[a-z]+/)) punteggio += 1;              
    if (val.match(/[A-Z]+/)) punteggio += 1;              
    if (val.match(/[0-9]+/)) punteggio += 1;              
    if (val.match(/[$@#&!%*?+]+/)) punteggio += 1;        

    if (punteggio <= 2) {
        this.passwordStrengthText = 'Forza: Debole';
        this.passwordStrengthClass = 'strength-weak';
    } else if (punteggio === 3 || punteggio === 4) {
        this.passwordStrengthText = 'Forza: Media';
        this.passwordStrengthClass = 'strength-medium';
    } else if (punteggio === 5 || punteggio === 6) {
        this.passwordStrengthText = 'Forza: Sicura';
        this.passwordStrengthClass = 'strength-secure';
    } else if (punteggio > 6) {
        this.passwordStrengthText = 'Forza: Molto sicura';
        this.passwordStrengthClass = 'strength-very-secure';
    }
  }

  isInvalid(field: string): boolean {
    if (!this.showErrors) return false;
    if (field === 'name') return !this.name.trim();
    if (field === 'email') return !this.email.trim();
    if (field === 'password') return !this.password.trim();
    if (field === 'confirmPassword') return !this.confirmPassword.trim() || this.password !== this.confirmPassword;
    return false;
  }

  async onRegister(event: Event) {
    event.preventDefault();
    this.showErrors = true;
    this.serverError = '';
    
    if (!this.name.trim() || !this.email.trim() || !this.password.trim() || !this.confirmPassword.trim()) {
        return;
    }

    if (this.password !== this.confirmPassword) {
      this.serverError = "Le password non coincidono.";
      return;
    }
    
    this.isSubmitting = true;

    try {
      const payload = {
        username: this.name,
        email: this.email,
        password: this.password
      };

      const response = await fetch(`${environment.apiUrl}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      this.isSubmitting = false;

      if (response.ok) {
        this.successMessage = `Benvenuto ${this.name}! Reindirizzamento al Login...`;
        setTimeout(() => {
            this.router.navigate(['/auth/login']);
        }, 2000);
      } else {
        this.serverError = data.error || "Impossibile completare la registrazione.";
      }

    } catch (error: any) {
      this.isSubmitting = false;
      this.serverError = "Errore di connessione. Il server Node.js è acceso?";
    }
  }
}