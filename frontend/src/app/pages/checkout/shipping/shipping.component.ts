import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-checkout-shipping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.scss']
})
export class ShippingComponent {
  nome = '';
  indirizzo = '';
  citta = '';
  cap = '';
  carta = '';
  scadenza = '';
  cvv = '';
  
  showErrors = false;

  formatCAP() {
    this.cap = this.cap.replace(/\D/g, '').substring(0, 5);
  }

  formatCard() {
    let value = this.carta.replace(/\D/g, '');
    value = value.substring(0, 16);
    const parts = value.match(/[\s\S]{1,4}/g) || [];
    this.carta = parts.join(' ');
  }

  formatExpiry() {
    let value = this.scadenza.replace(/\D/g, '');
    if (value.length > 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.scadenza = value;
  }

  formatCVV() {
    this.cvv = this.cvv.replace(/\D/g, '').substring(0, 4);
  }

  validate(): boolean {
    this.showErrors = true;
    const cartaPulita = this.carta.replace(/\s/g, '');
    
    const isValid = !!(
      this.nome.trim() &&
      this.indirizzo.trim() &&
      this.citta.trim() &&
      /^\d{5}$/.test(this.cap) &&
      /^\d{16}$/.test(cartaPulita) &&
      !this.isScadenzaInvalid() &&
      /^\d{3,4}$/.test(this.cvv)
    );

    return isValid;
  }
  
  isScadenzaInvalid(): boolean {
    if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.scadenza)) {
      return true; 
    }

    const [monthStr, yearStr] = this.scadenza.split('/');
    const month = parseInt(monthStr, 10);
    const year = parseInt(yearStr, 10);

    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear() % 100;

    return year < currentYear || (year === currentYear && month < currentMonth);
  }

  isInvalid(field: string): boolean {
    if (!this.showErrors) return false;
    
    switch(field) {
      case 'nome': return !this.nome.trim();
      case 'indirizzo': return !this.indirizzo.trim();
      case 'citta': return !this.citta.trim();
      case 'cap': return !/^\d{5}$/.test(this.cap);
      case 'carta': return !/^\d{16}$/.test(this.carta.replace(/\s/g, ''));
      
      case 'scadenza': {
        if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(this.scadenza)) {
          return true;
        }

        const [monthStr, yearStr] = this.scadenza.split('/');
        const month = parseInt(monthStr, 10);
        const year = parseInt(yearStr, 10);

        const now = new Date();
        const currentMonth = now.getMonth() + 1;
        const currentYear = now.getFullYear() % 100;

        return year < currentYear || (year === currentYear && month < currentMonth);
      }

      case 'cvv': return !/^\d{3,4}$/.test(this.cvv);
      default: return false;
    }
  }
}