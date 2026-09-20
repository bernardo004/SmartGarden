import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './preferences.page.html',
  styleUrls: ['./preferences.page.scss']
})
export class PreferencesPage implements OnInit {
  userEmail = '';
  prefs = {
      tempUnit: 'C',
      language: 'it',
      emailNotifs: true,
      pushNotifs: true
  };

  async ngOnInit() {
      this.userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
      if (!this.userEmail) return;

      const res = await fetch(`${environment.apiUrl}/settings/${this.userEmail}`);
      if (res.ok) {
          const data = await res.json();
          this.prefs = data.prefs || this.prefs;
      }
  }

  async savePreferences() {
      try {
          const res = await fetch(`${environment.apiUrl}/settings/${this.userEmail}`, {
              method: 'PUT', 
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ prefs: this.prefs })
          });
          
          if (res.ok) {
              alert("✅ Preferenze aggiornate con successo!");
          } else {
              const errorText = await res.text();
              alert(`❌ Errore Server (${res.status}): ${errorText}`);
          }
      } catch (e) {
          alert("❌ Errore di rete: il server Node.js è spento o irraggiungibile.");
      }
  }
}