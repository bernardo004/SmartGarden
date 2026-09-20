import { Component, Input } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { ModalComponent } from '../../../shared/modal/modal.component';
import { ImageEditorComponent } from '../../../shared/image-editor/image-editor.component';
import { AnimateOnScrollDirective } from '../../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ImageEditorComponent, AnimateOnScrollDirective],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent {
  @Input() plant: any;
  @Input() currentUserRole: string = 'Membro';
  @Input() isLoading: boolean = true;

  isEditImgModalOpen = false;
  tempImageUrl = '';
  tempObjPosY = 50;
  tempZoom = 0;

  isEditDescModalOpen = false;
  isWaterModalOpen = false;
  isStatusModalOpen = false;
  isDeleteModalOpen = false;

  waterAmount = 500;
  tempDesc = '';
  tempStatus = 'In Salute';
  tempStatusNote = '';

  STATUS_MAP: any = {
    'In Salute': { icon: '✓', class: 'status-success', noteClass: 'success' },
    'Necessita Acqua': { icon: '💧', class: 'status-warning', noteClass: 'warning' },
    'Parassiti': { icon: '🐛', class: 'status-danger', noteClass: 'danger' },
    'Carenza Nutrienti': { icon: '🍂', class: 'status-warning', noteClass: 'warning' }
  };

  constructor(private router: Router) {}

  private getCurrentUser() {
    const email = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || 'sconosciuto@email.com';
    const name = localStorage.getItem('smartgarden_username') || sessionStorage.getItem('smartgarden_username') || email.split('@')[0];
    return { email, name };
  }

  openEditImgModal() {
    this.tempImageUrl = this.plant.imageUrl;
    this.tempObjPosY = this.plant.imgPosY || 50;
    this.tempZoom = this.plant.imgZoom || 0;
    this.isEditImgModalOpen = true;
  }

  triggerFileInput() {
    const fileInput = document.getElementById('plantFileInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  triggerCamera() {
      document.getElementById('cameraInput')?.click();
  }

  triggerGallery() {
      document.getElementById('galleryInput')?.click();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {


	  if (file.size > 50 * 1024 * 1024) {
        alert('La foto è troppo grande! Cerca di usare un file o uno scatto inferiore a 50MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tempImageUrl = e.target.result;
        this.tempObjPosY = 50;
        this.tempZoom = 0;
      };
      reader.readAsDataURL(file);
    }
  }

  async applyImage() {
    this.plant.imageUrl = this.tempImageUrl;
    this.plant.imgPosY = this.tempObjPosY;
    this.plant.imgZoom = this.tempZoom;
    this.isEditImgModalOpen = false;

    try {
      await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: this.tempImageUrl,
          imgPosY: this.tempObjPosY,
          imgZoom: this.tempZoom
        })
      });
    } catch (e) { console.error("Errore salvataggio immagine", e); }
  }

  openEditDescModal() {
    this.tempDesc = this.plant.description;
    this.isEditDescModalOpen = true;
  }

  openDeleteModal() {
    this.isDeleteModalOpen = true;
  }

  async applyDesc() {
    this.plant.description = this.tempDesc;
    this.isEditDescModalOpen = false;
    const user = this.getCurrentUser();

    try {
      await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: this.tempDesc })
      });

      const eventBody = {
        userEmail: user.email,
        userName: user.name,
        icon: '📝',
        title: `Nuova Descrizione`,
        meta: `Oggi - ${user.name}`,
        type: 'description'
      };

      const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        this.plant.events.unshift({ id: savedEvent._id, ...eventBody });
        if (this.plant.events.length > 5) this.plant.events.pop();
      }
    } catch (e) { console.error(e); }
  }

  openWaterModal() { this.isWaterModalOpen = true; }

  async applyWater() {
    const user = this.getCurrentUser();
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    const eventBody = {
      userEmail: user.email,
      userName: user.name,
      icon: '🚿',
      title: `Innaffiata (${this.waterAmount} ml)`,
      meta: `Oggi, ${timeString} - ${user.name}`,
      type: 'water'
    };

    try {
      const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        this.plant.events.unshift({ id: savedEvent._id, ...eventBody });
      }

      this.plant.isHealthy = true;
      this.plant.statusIcon = '✓';
      this.plant.statusText = 'In Salute';
      this.plant.statusClass = 'status-success';
      this.plant.statusNote = '';

      await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusText: 'In Salute', statusIcon: '✓', statusClass: 'status-success', statusNote: ''
        })
      });

    } catch (e) { console.error(e); }

    this.isWaterModalOpen = false;
  }

  openStatusModal() {
    this.tempStatus = this.plant.statusText;
    this.tempStatusNote = this.plant.statusNote || '';
    this.isStatusModalOpen = true;
  }

  async applyStatus() {
    const user = this.getCurrentUser();
    const statusInfo = this.STATUS_MAP[this.tempStatus];
    const now = new Date();
    const timeString = now.getHours().toString().padStart(2, '0') + ':' + now.getMinutes().toString().padStart(2, '0');

    this.plant.statusText = this.tempStatus;
    this.plant.statusIcon = statusInfo.icon;
    this.plant.statusClass = statusInfo.class;
    this.plant.statusNote = this.tempStatusNote.trim();
    this.plant.statusNoteClass = statusInfo.noteClass;

    try {
      await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          statusText: this.plant.statusText,
          statusIcon: this.plant.statusIcon,
          statusClass: this.plant.statusClass,
          statusNote: this.plant.statusNote,
          statusNoteClass: this.plant.statusNoteClass
        })
      });

      const eventBody = {
        userEmail: user.email,
        userName: user.name,
        icon: statusInfo.icon,
        title: `Stato: ${this.tempStatus}`,
        meta: `Oggi, ${timeString} - ${user.name}`,
        type: 'status'
      };

      const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventBody)
      });

      if (res.ok) {
        const savedEvent = await res.json();
        this.plant.events.unshift({ id: savedEvent._id, ...eventBody });
      }
    } catch (e) { console.error(e); }

    this.isStatusModalOpen = false;
  }

  async confirmDelete() {
    const user = this.getCurrentUser();
    try {
      const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userEmail: user.email, userName: user.name })
      });

      if (res.ok) {
        this.isDeleteModalOpen = false;
        alert('Pianta eliminata. Il gruppo è stato notificato.');
        this.router.navigate(['/garden', this.plant.groupId]);
      }
    } catch (e) { alert('Errore di connessione al server.'); }
  }
}
