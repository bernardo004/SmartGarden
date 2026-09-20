import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { NavbarComponent } from '../../core/navbar/navbar.component';
import { GardenCardComponent } from './garden-card/garden-card.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, GardenCardComponent, AnimateOnScrollDirective, IonContent, NavbarComponent],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss']
})
export class DashboardPage implements OnInit {
  userName: string = 'Caricamento...';
  userEmail: string = '';
  gardens: any[] = [];

  isModalOpen = false;
  newGardenName = '';
  newGardenDesc = '';
  isCreating = false;

  isLoading: boolean = true;
  showAnimations: boolean = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.userName = localStorage.getItem('smartgarden_username') || sessionStorage.getItem('smartgarden_username') || 'Utente';
    this.userEmail = localStorage.getItem('smartgarden_user_email') || sessionStorage.getItem('smartgarden_user_email') || '';
  }

  async ionViewWillEnter() {
    this.showAnimations = false;
    setTimeout(() => {
        this.showAnimations = true;
    }, 50);

    if (!this.userEmail) {
        this.isLoading = false;
        return;
    }

    if (this.gardens.length === 0) {
        this.isLoading = true;
    }

    try {
        const response = await fetch(`${environment.apiUrl}/user-gardens/${this.userEmail}`);
        if (response.ok) {
            const dbGardens = await response.json();

            this.gardens = dbGardens.map((g: any) => {
                let userRole = 'Membro';
                if (g.ownerEmail === this.userEmail) userRole = 'Creatore';
                else if (g.adminEmails && g.adminEmails.includes(this.userEmail)) userRole = 'Admin';

                const totalMembers = 1 + (g.adminEmails?.length || 0) + (g.memberEmails?.length || 0);

                const savedImg = localStorage.getItem(`garden_${g._id}_cover`);
                const savedY = localStorage.getItem(`garden_${g._id}_posY`);
                const savedZoom = localStorage.getItem(`garden_${g._id}_zoom`);

                return {
                    id: g._id,
                    name: g.name,
                    role: userRole,
                    description: g.description,
                    imageUrl: savedImg || g.imageUrl,
                    bgPosY: savedY ? parseInt(savedY, 10) : 50,
                    bgZoom: savedZoom ? parseInt(savedZoom, 10) : 0,
                    plantCount: g.plantCount || 0,
                    memberCount: totalMembers
                };
            });
        }
    } catch (error) {
        console.error("Errore di caricamento giardini:", error);
    } finally {
        this.isLoading = false;
        this.cdr.detectChanges();
    }
  }

  ionViewWillLeave() {
      this.showAnimations = false;
  }

  openModal() {
      this.isModalOpen = true;
  }

  closeModal() {
      this.isModalOpen = false;
      this.newGardenName = '';
      this.newGardenDesc = '';
  }

  async createGarden() {
      if (!this.newGardenName.trim() || !this.userEmail) return;

      this.isCreating = true;
      try {
          const response = await fetch(`${environment.apiUrl}/user-gardens/create`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  name: this.newGardenName,
                  description: this.newGardenDesc,
                  ownerEmail: this.userEmail
              })
          });

          if (response.ok) {
              this.closeModal();
              this.ionViewWillEnter();
          } else {
              alert('Errore durante la creazione del giardino.');
          }
      } catch (error) {
          console.error("Errore di connessione:", error);
      } finally {
          this.isCreating = false;
      }
  }
}
