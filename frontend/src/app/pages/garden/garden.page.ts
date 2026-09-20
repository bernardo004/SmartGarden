import { Component, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';

import { PlantListComponent } from './plant-list/plant-list.component';
import { MemberListComponent } from './member-list/member-list.component';
import { ModalComponent } from '../../shared/modal/modal.component';
import { ImageEditorComponent } from '../../shared/image-editor/image-editor.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';
import { PageBannerComponent } from '../../core/page-banner/page-banner.component';

@Component({
  selector: 'app-garden',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    PlantListComponent,
    MemberListComponent,
    ModalComponent,
    ImageEditorComponent,
    AnimateOnScrollDirective,
    PageBannerComponent
  ],
  templateUrl: './garden.page.html',
  styleUrls: ['./garden.page.scss']
})
export class GardenPage implements OnInit {
  garden: any = { id: '', nome: 'Caricamento...', descrizione: '', imageUrl: '', bgPosY: 50, bgZoom: 0 };

  isLoadingPlants = true;
  isLoading = true;

  currentUserEmail: string = '';
  currentUserRole: string = 'Membro';
  canEditCover = false;

  plants: any[] = [];
  admins: any[] = [];
  participants: any[] = [];
  isEditCoverModalOpen = false;
  tempImageUrl = '';
  tempBgPosY = 50;
  tempBgZoom = 0;
  selectedCoverFile: File | null = null;

  isInviteModalOpen = false;
  inviteEmail = '';

  isAddPlantModalOpen = false;
  newPlantData = { name: '', description: '' };

  isEditTitleModalOpen = false;
  tempGardenName = '';

  isEditDescModalOpen = false;
  tempGardenDescription = '';

  isProfileModalOpen = false;
  selectedMember: any = null;

  isLeaveModalOpen = false;

  isTransferModalOpen = false;
  selectedNewCreator: any = null;

  isDeleteGroupModalOpen = false;
  deleteConfirmName = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    this.currentUserEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
  }

  async ionViewWillEnter() {
    const groupId = this.route.snapshot.paramMap.get('id');
    if (groupId) {
        this.garden.id = groupId;
        await this.fetchGardenData(groupId);
    }
  }

  formatTimeAgo(dateString: string): string {
    if (!dateString) return 'Nessun dato';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');

    if (diffMins < 1) return 'Adesso';
    if (diffMins < 60) return `${diffMins} min fa`;

    if (date.getDate() === now.getDate() && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear()) {
        return `Oggi, ${hours}:${minutes}`;
    }

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.getDate() === yesterday.getDate() && date.getMonth() === yesterday.getMonth() && date.getFullYear() === yesterday.getFullYear()) {
        return `Ieri, ${hours}:${minutes}`;
    }
    return `${diffDays} giorni fa`;
  }

  async fetchGardenData(id: string) {
      this.isLoadingPlants = true;
      this.isLoading = true;
      try {
          const response = await fetch(`${environment.apiUrl}/group/${id}`);
          if (response.ok) {
              const dbGroup = await response.json();

              if (dbGroup.ownerEmail === this.currentUserEmail) {
                  this.currentUserRole = 'Creatore';
                  this.canEditCover = true;
              } else if (dbGroup.adminEmails && dbGroup.adminEmails.includes(this.currentUserEmail)) {
                  this.currentUserRole = 'Admin';
                  this.canEditCover = true;
              } else {
                  this.currentUserRole = 'Membro';
                  this.canEditCover = false;
              }

              this.garden.nome = dbGroup.name;
              this.garden.descrizione = dbGroup.description || dbGroup.descrizione || '';

              const savedImg = localStorage.getItem(`garden_${this.garden.id}_cover`);
              const savedY = localStorage.getItem(`garden_${this.garden.id}_posY`);
              const savedZoom = localStorage.getItem(`garden_${this.garden.id}_zoom`);

              this.garden.imageUrl = savedImg || dbGroup.imageUrl;
              this.garden.bgPosY = savedY ? parseInt(savedY, 10) : 50;
              this.garden.bgZoom = savedZoom ? parseInt(savedZoom, 10) : 0;

              this.admins = [];
              this.participants = [];
              if (dbGroup.ownerEmail) this.admins.push(await this.fetchUserProfile(dbGroup.ownerEmail, 'Creatore'));
              if (dbGroup.adminEmails) {
                  for (let email of dbGroup.adminEmails) this.admins.push(await this.fetchUserProfile(email, 'Admin'));
              }
              if (dbGroup.memberEmails) {
                  for (let email of dbGroup.memberEmails) this.participants.push(await this.fetchUserProfile(email, 'Membro'));
              }

              this.plants = [];
              const plantsRes = await fetch(`${environment.apiUrl}/group/${id}/plants`);
              if (plantsRes.ok) {
                  const dbPlants = await plantsRes.json();
                  this.plants = dbPlants.map((p: any) => ({
                      id: p.plantId || p._id,
                      name: p.name || p.nome || 'Pianta Sconosciuta',
                      description: p.description || p.descrizione || '',
                      imageUrl: p.imageUrl || p.img || 'assets/img/dashboard/orto_balcone.jpg',
                      imgPosY: 50, imgZoom: 0,
                      sensorsCount: p.sensorsCount || 0,
                      lastSync: p.lastSyncDate ? this.formatTimeAgo(p.lastSyncDate) : 'Nessun sensore',
                      isHealthy: true,
                      statusIcon: p.statusIcon || '✓',
                      statusText: p.statusText || p.notes || p.nota || 'Nessuna nota',
                      statusClass: p.statusClass || 'status-success'
                  }));
              }
          } else {
              this.garden.nome = "Errore: Giardino non trovato";
          }
      } catch (error) {
          console.error("Connessione al server fallita:", error);
      } finally {
          this.isLoadingPlants = false;
          this.isLoading = false;
      }
  }

  async fetchUserProfile(email: string, role: string) {
      try {
          const res = await fetch(`${environment.apiUrl}/user/${email}`);
          if (res.ok) {
              const userData = await res.json();

              let displayName = userData.username || email.split('@')[0];
              const isMe = email === this.currentUserEmail;
              if (isMe) displayName += ' (Tu)';

              const initials = displayName.split(' ').map((n: any) => n[0]).join('').substring(0, 2).toUpperCase();
              const colors = ['bg-orange', 'bg-blue', 'bg-green', 'bg-purple'];

              return {
                  id: email,
                  name: displayName,
                  initials: initials,
                  role: role,
                  isOnline: userData.status === 'online',
                  avatarColor: colors[email.length % colors.length],
                  biography: userData.bio || '',
                  imageUrl: userData.avatar?.url || userData.imageUrl || null
              };
          }
      } catch (e) { console.error(e); }

      return {
          id: email,
          name: email.split('@')[0],
          initials: email.substring(0, 2).toUpperCase(),
          role: role,
          isOnline: email === this.currentUserEmail,
          avatarColor: 'bg-gray',
          biography: '',
          imageUrl: null
      };
  }

  openInviteModal() { this.isInviteModalOpen = true; }
  closeInviteModal() { this.isInviteModalOpen = false; this.inviteEmail = ''; }

  async sendInvite() {
      if (!this.inviteEmail) return;
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}/invite`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  targetEmail: this.inviteEmail,
                  senderName: localStorage.getItem('smartgarden_username') || 'Un utente',
                  groupName: this.garden.nome
              })
          });
          if (res.ok) {
              alert("Invito inviato con successo!");
              this.closeInviteModal();
          }
      } catch (error) { alert("Errore di connessione al server."); }
  }

  openAddPlantModal() { this.isAddPlantModalOpen = true; }
  closeAddPlantModal() { this.isAddPlantModalOpen = false; this.newPlantData = { name: '', description: '' }; }

  async addNewPlant() {
      if (!this.newPlantData.name) return;
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}/plants`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(this.newPlantData)
          });
          if (res.ok) {
              this.closeAddPlantModal();
              this.fetchGardenData(this.garden.id);
          } else { alert("Errore durante l'aggiunta della pianta."); }
      } catch (error) { alert("Errore di connessione al server."); }
  }


  openEditCoverModal() {
    this.tempImageUrl = this.garden.imageUrl;
    this.tempBgPosY = this.garden.bgPosY;
    this.tempBgZoom = this.garden.bgZoom;
    this.selectedCoverFile = null;
    this.isEditCoverModalOpen = true;
  }
  closeEditCoverModal() { this.isEditCoverModalOpen = false; }
  triggerFileInput() { document.getElementById('coverFileInput')?.click(); }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('La foto è troppo grande! Cerca di usare un file inferiore a 5MB.');
        return;
      }
      this.selectedCoverFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.tempImageUrl = e.target.result;
        this.tempBgPosY = 50;
        this.tempBgZoom = 0;
      };
      reader.readAsDataURL(file);
    }
  }

  async applyCover() {
    this.garden.imageUrl = this.tempImageUrl;
    this.garden.bgPosY = this.tempBgPosY;
    this.garden.bgZoom = this.tempBgZoom;

    localStorage.setItem(`garden_${this.garden.id}_posY`, this.garden.bgPosY.toString());
    localStorage.setItem(`garden_${this.garden.id}_zoom`, this.garden.bgZoom.toString());

    this.closeEditCoverModal();

    try {
      let bodyData: any;
      let headersConfig: any = {};

      if (this.selectedCoverFile) {
        const formData = new FormData();
        formData.append('image', this.selectedCoverFile);
        formData.append('bgPosY', this.tempBgPosY.toString());
        formData.append('bgZoom', this.tempBgZoom.toString());
        bodyData = formData;
      } else {
        headersConfig['Content-Type'] = 'application/json';
        bodyData = JSON.stringify({ bgPosY: this.tempBgPosY, bgZoom: this.tempBgZoom });
      }

      const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}`, {
        method: 'PUT',
        headers: headersConfig,
        body: bodyData
      });

      if (!res.ok) console.error("Il server non ha elaborato la richiesta.");
      this.selectedCoverFile = null;

    } catch (error) { console.error("Errore salvataggio:", error); }
  }

  openEditTitleModal() {
      this.tempGardenName = this.garden.nome;
      this.isEditTitleModalOpen = true;
  }
  closeEditTitleModal() { this.isEditTitleModalOpen = false; }

  async applyTitle() {
      if (!this.tempGardenName.trim()) return;
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: this.tempGardenName.trim() })
          });
          if (res.ok) {
              this.garden.nome = this.tempGardenName.trim();
              this.closeEditTitleModal();
          }
      } catch (error) { alert("Errore di connessione al server."); }
  }

  openEditDescModal() {
      this.tempGardenDescription = this.garden.descrizione || '';
      this.isEditDescModalOpen = true;
  }
  closeEditDescModal() { this.isEditDescModalOpen = false; }

  async applyDescription() {
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ description: this.tempGardenDescription.trim() })
          });
          if (res.ok) {
              this.garden.descrizione = this.tempGardenDescription.trim();
              this.closeEditDescModal();
          }
      } catch (error) { alert("Errore di connessione al server."); }
  }

  openProfileModal(member: any) {
      this.selectedMember = member;
      this.isProfileModalOpen = true;
  }

  closeProfileModal() {
      this.isProfileModalOpen = false;
      setTimeout(() => { this.selectedMember = null; }, 300);
  }

  async handleRoleChange(data: { email: string, action: 'promote' | 'demote' }) {
      try {
          await fetch(`${environment.apiUrl}/group/${this.garden.id}/role`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: data.email, action: data.action })
          });
          this.fetchGardenData(this.garden.id);
      } catch (error) { console.error("Errore modifica ruolo", error); }
  }

  async handleKickMember(email: string) {
      if (!confirm(`Sei sicuro di voler rimuovere l'utente dal gruppo?`)) return;
      try {
          await fetch(`${environment.apiUrl}/group/${this.garden.id}/member/${email}`, { method: 'DELETE' });
          this.fetchGardenData(this.garden.id);
      } catch (error) { console.error("Errore rimozione membro", error); }
  }

  openLeaveModal() { this.isLeaveModalOpen = true; }
  closeLeaveModal() { this.isLeaveModalOpen = false; }

  openTransferModal(member: any) {
      this.selectedNewCreator = member;
      this.isTransferModalOpen = true;
  }
  closeTransferModal() { this.isTransferModalOpen = false; }

  openDeleteGroupModal() {
      this.deleteConfirmName = '';
      this.isDeleteGroupModalOpen = true;
  }
  closeDeleteGroupModal() { this.isDeleteGroupModalOpen = false; }

  async confirmLeave() {
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}/leave`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: this.currentUserEmail })
          });

          const data = await res.json();

          if (res.ok) {
              this.closeLeaveModal();
              this.router.navigate(['/dashboard']);
          } else {
              alert("❌ Errore dal server: " + (data.error || "Azione fallita"));
          }
      } catch (e) { alert("❌ Errore di rete. Controlla il server Node.js!"); }
  }

  async confirmTransfer() {
      if (!this.selectedNewCreator) return;
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}/transfer-ownership`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  newOwnerEmail: this.selectedNewCreator.id,
                  currentOwnerEmail: this.currentUserEmail
              })
          });

          const data = await res.json();

          if (res.ok) {
              this.closeTransferModal();
              this.fetchGardenData(this.garden.id);
          } else {
              alert("❌ Errore dal server: " + (data.error || "Azione fallita"));
          }
      } catch (e) { alert("❌ Errore di rete. Controlla il server Node.js!"); }
  }

  async confirmDeleteGroup() {
      if (this.deleteConfirmName !== this.garden.nome) return;
      try {
          const res = await fetch(`${environment.apiUrl}/group/${this.garden.id}`, {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: this.currentUserEmail })
          });

          const data = await res.json();

          if (res.ok) {
              alert("✅ Giardino eliminato definitivamente.");
              this.closeDeleteGroupModal();
              this.router.navigate(['/dashboard']);
          } else {
              alert("❌ Errore dal server: " + (data.error || "Azione fallita"));
          }
      } catch (e) { alert("❌ Errore di rete. Controlla il server Node.js!"); }
  }
}
