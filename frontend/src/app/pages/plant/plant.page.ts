import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { ProfileComponent } from './profile/profile.component';
import { ChartsComponent } from './charts/charts.component';
import { PageBannerComponent } from '../../core/page-banner/page-banner.component';
import { ModalComponent } from '../../shared/modal/modal.component';

@Component({
  selector: 'app-plant',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, ProfileComponent, ChartsComponent, PageBannerComponent, ModalComponent],
  templateUrl: './plant.page.html',
  styleUrls: ['./plant.page.scss']
})
export class PlantPage implements OnInit {
  currentUserEmail = '';
  currentUserRole = 'Membro';
  isLoading = true;

  backToGardenUrl = '/dashboard';

  gardenContext = {
    nome: 'Caricamento Giardino...',
    imageUrl: 'assets/img/dashboard/orto_balcone.jpg',
    bgPosY: 50,
    bgZoom: 0
  };

  plant: any = {
    id: '',
    name: 'Caricamento...',
    datePlanted: '...',
    isHealthy: true,
    statusIcon: '✓',
    statusText: 'In Salute',
    statusClass: 'status-success',
    imageUrl: 'assets/img/dashboard/orto_balcone.jpg',
    imgPosY: 50,
    imgZoom: 0,
    description: "Caricamento dettagli...",
    statusNote: "",
    statusNoteClass: "",
    sensors: { hasSoilMoisture: true, hasAmbientHumidity: true, hasTemperature: true, hasLight: true },
    events: []
  };

  isEditTitleModalOpen = false;
  tempPlantName = '';

  isEditDateModalOpen = false;
  tempPlantedDate = '';

  constructor(private route: ActivatedRoute, private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.currentUserEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';

    this.route.paramMap.subscribe(params => {
        const plantIdFromUrl = params.get('id');
        if (plantIdFromUrl) {
            this.plant.id = plantIdFromUrl;
            this.fetchRealPlantData(plantIdFromUrl);
        }
    });
  }

  async fetchRealPlantData(currentPlantId: string) {
    this.isLoading = true;
    try {
      const res = await fetch(`${environment.apiUrl}/plants/${currentPlantId}`);
      if (res.ok) {
        const dbPlant = await res.json();

        if (dbPlant.groupId) {
            this.backToGardenUrl = `/garden/${dbPlant.groupId}`;
        }

        this.plant.id = dbPlant.plantId || dbPlant._id;
        this.plant.name = dbPlant.name;
        this.plant.groupId = dbPlant.groupId;
        this.plant.description = dbPlant.description || "Nessuna descrizione.";
        this.plant.imageUrl = dbPlant.imageUrl || 'assets/img/dashboard/orto_balcone.jpg';
        this.plant.imgPosY = dbPlant.imgPosY || 50;
        this.plant.imgZoom = dbPlant.imgZoom || 0;
        this.plant.statusText = dbPlant.statusText || "In Salute";
        this.plant.statusIcon = dbPlant.statusIcon || "✓";
        this.plant.statusClass = dbPlant.statusClass || "status-success";
        this.plant.statusNote = dbPlant.statusNote || dbPlant.notes || dbPlant.nota || "";
        this.plant.statusNoteClass = dbPlant.statusNoteClass || (this.plant.statusNote ? "warning" : "");
		this.plant.plantedAt = dbPlant.plantedAt || null;

        if (dbPlant.events) {
            this.plant.events = dbPlant.events.map((e: any) => ({
                id: e._id, icon: e.icon, title: e.title, meta: e.meta
            }));
        }

        if (dbPlant.groupId) {
            const groupRes = await fetch(`${environment.apiUrl}/group/${dbPlant.groupId}`);
            if (groupRes.ok) {
                const group = await groupRes.json();

                this.gardenContext.nome = group.name;
                this.gardenContext.imageUrl = group.imageUrl || 'assets/img/dashboard/orto_balcone.jpg';
                this.gardenContext.bgPosY = group.bgPosY || 50;
                this.gardenContext.bgZoom = group.bgZoom || 0;

                if (group.ownerEmail === this.currentUserEmail) {
                    this.currentUserRole = 'Creatore';
                } else if (group.adminEmails && group.adminEmails.includes(this.currentUserEmail)) {
                    this.currentUserRole = 'Admin';
                } else {
                    this.currentUserRole = 'Membro';
                }
            }
        }
      } else {
        this.plant.name = "Pianta non trovata";
        this.plant.description = "Assicurati di aver aperto il link corretto dal Giardino.";
      }
    } catch (error) {
      console.error("Errore nel caricamento della pianta", error);
    } finally {
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  openEditTitleModal() {
      this.tempPlantName = this.plant.name;
      this.isEditTitleModalOpen = true;
  }

  closeEditTitleModal() {
      this.isEditTitleModalOpen = false;
  }

  async applyTitle() {
      if (!this.tempPlantName.trim()) return;

      try {
          const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: this.tempPlantName.trim() })
          });

          if (res.ok) {
              this.plant.name = this.tempPlantName.trim();
              this.closeEditTitleModal();
          } else {
              alert("Errore durante l'aggiornamento del nome.");
          }
      } catch (error) {
          alert("Errore di connessione al server.");
      }
  }

  openEditDateModal() {
      if (this.plant.plantedAt) {
          const d = new Date(this.plant.plantedAt);
          this.tempPlantedDate = d.toISOString().split('T')[0];
      } else {
          this.tempPlantedDate = '';
      }
      this.isEditDateModalOpen = true;
  }

  closeEditDateModal() {
      this.isEditDateModalOpen = false;
  }

  async applyPlantedDate() {
      if (!this.tempPlantedDate) return;

      try {
          const res = await fetch(`${environment.apiUrl}/plants/${this.plant.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ plantedAt: this.tempPlantedDate })
          });

          if (res.ok) {
              this.plant.plantedAt = this.tempPlantedDate;
              this.closeEditDateModal();
              this.cdr.detectChanges();
          } else {
              alert("Errore durante il salvataggio della data.");
          }
      } catch (e) {
          console.error(e);
          alert("Errore di rete durante il salvataggio della data.");
      }
  }
}
