import { Injectable } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(private router: Router) {}

  isLoggedIn(): boolean {
    const local = localStorage.getItem('smartgarden_logged_in');
    const session = sessionStorage.getItem('smartgarden_logged_in');
    return local === 'true' || session === 'true';
  }

  getUserEmail(): string | null {
    const local = localStorage.getItem('smartgarden_user_email');
    const session = sessionStorage.getItem('smartgarden_user_email');
    return local || session;
  }

  logout(): void {
    localStorage.removeItem('smartgarden_logged_in');
    sessionStorage.removeItem('smartgarden_logged_in');
    localStorage.removeItem('smartgarden_user_email');
    sessionStorage.removeItem('smartgarden_user_email');
    localStorage.removeItem('smartgarden_username');
    sessionStorage.removeItem('smartgarden_username');

    this.router.navigate(['/home']);
  }
}