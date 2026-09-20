import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { Router } from '@angular/router';

@Component({
  selector: 'app-security',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './security.page.html',
  styleUrls: ['./security.page.scss']
})
export class SecurityPage implements OnInit {
  isDeleteModalOpen = false;
  userEmail = '';
  newPassword = '';
  confirmPassword = '';

  constructor(private router: Router) {}

  ngOnInit() {
      this.userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
  }

  async updatePassword() {
      if (!this.newPassword) return;
      if (this.newPassword !== this.confirmPassword) {
          alert("Le password non coincidono!");
          return;
      }
      if (!this.userEmail) {
          alert("Errore: Impossibile trovare l'email dell'utente.");
          return;
      }
      try {
          const res = await fetch(`${environment.apiUrl}/settings/security/password`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: this.userEmail, newPassword: this.newPassword })
          });
          if (res.ok) {
              alert("Password cambiata con successo!");
              this.newPassword = '';
              this.confirmPassword = '';
          } else {
              alert("Errore dal server durante l'aggiornamento.");
          }
      } catch (e) {
          alert("Errore di connessione al server.");
      }
  }

  openDeleteModal() { this.isDeleteModalOpen = true; }

  async confirmDelete() {
    if (!this.userEmail) return;
    
    try {
        const res = await fetch(`${environment.apiUrl}/settings/account/${this.userEmail}`, { method: 'DELETE' });
        
        if (res.ok) {
            alert("Account eliminato correttamente. Ci dispiace vederti andare via!");
            localStorage.clear();
            sessionStorage.clear();
            this.router.navigate(['/auth/login']);
        } else {
            const errorData = await res.json();
            alert(`⚠️ Attenzione:\n${errorData.error}`);
        }
    } catch (e) {
        alert("❌ Errore di rete durante l'eliminazione dell'account.");
    }
  }
}