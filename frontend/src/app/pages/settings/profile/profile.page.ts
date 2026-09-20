import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ModalComponent } from '../../../shared/modal/modal.component';
import { ImageEditorComponent } from '../../../shared/image-editor/image-editor.component'; 

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, ImageEditorComponent],
  templateUrl: './profile.page.html',
  styleUrls: ['./profile.page.scss']
})
export class ProfilePage implements OnInit {
  userEmail = '';
  profileData = {
      username: '',
      bio: '',
      gender: 'Non specificato',
      avatar: { url: '', zoom: 0, posY: 50 }
  };
  userInitials = '';
  isPhotoModalOpen = false;
  tempAvatarUrl = '';

  constructor(private cdr: ChangeDetectorRef) {}

  async ngOnInit() {
      this.userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
      if (!this.userEmail) return;
      try {
          const res = await fetch(`${environment.apiUrl}/settings/${this.userEmail}`);
          if (res.ok) {
              const data = await res.json();
              this.profileData = { ...this.profileData, ...data };
              this.updateInitials();
          }
      } catch (e) {
          console.error(e);
      } finally {
          this.cdr.detectChanges();
      }
  }

  updateInitials() {
      this.userInitials = this.profileData.username.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
  }

  openPhotoModal() {
      this.tempAvatarUrl = this.profileData.avatar.url; 
      this.isPhotoModalOpen = true;
  }

  savePhoto() {
      this.profileData.avatar.url = this.tempAvatarUrl;
      this.isPhotoModalOpen = false;
      this.saveProfile(); 
  }

  removePhoto() {
      this.profileData.avatar = { url: '', zoom: 0, posY: 50 };
      this.saveProfile();
  }

  async saveProfile() {
      try {
          const res = await fetch(`${environment.apiUrl}/settings/${this.userEmail}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.profileData)
          });
          if (res.ok) {
              alert("Profilo aggiornato!");
              this.updateInitials();
              localStorage.setItem('smartgarden_username', this.profileData.username); 
          }
      } catch (e) {
          alert("Errore durante il salvataggio.");
      }
  }

  triggerFileInput() {
      document.getElementById('avatarFileInput')?.click();
  }

  onFileSelected(event: any) {
      const file = event.target.files[0];
      if (file) {
          if (file.size > 10 * 1024 * 1024) {
              alert('La foto è troppo grande! Scegli un file più piccolo di 2MB.');
              return;
          }

          const reader = new FileReader();
          reader.onload = (e: any) => {
              this.tempAvatarUrl = e.target.result; 
          };
          reader.readAsDataURL(file);
      }
  }
}