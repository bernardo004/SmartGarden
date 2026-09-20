import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive'; 

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [RouterOutlet, RouterLink, IonContent, AnimateOnScrollDirective], 
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss']
})
export class AuthPage {
  showAnimations = false;

  ionViewWillEnter() {
      this.showAnimations = false;
      setTimeout(() => this.showAnimations = true, 50);
  }

  ionViewWillLeave() {
      this.showAnimations = false;
  }
}