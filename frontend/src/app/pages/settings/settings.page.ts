import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone'; 
import { FocusHeaderComponent } from '../../core/focus-header/focus-header.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, IonContent, FocusHeaderComponent, AnimateOnScrollDirective],
  templateUrl: './settings.page.html',
  styleUrls: ['./settings.page.scss']
})
export class SettingsPage {
  showAnimations = false;

  ionViewWillEnter() {
      this.showAnimations = false;
      setTimeout(() => this.showAnimations = true, 50);
  }

  ionViewWillLeave() {
      this.showAnimations = false;
  }
}