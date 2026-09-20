import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { IonContent } from '@ionic/angular/standalone'; 
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive'; 
import { NavbarComponent } from '../../core/navbar/navbar.component'; 
import { FooterComponent } from '../../core/footer/footer.component';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    RouterLink, 
    IonContent, 
    AnimateOnScrollDirective, 
    NavbarComponent, 
    FooterComponent
  ],
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss']
})
export class HomePage {
  showAnimations = false;

  constructor(private router: Router, private auth: AuthService) {}

  ionViewWillEnter() {
    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
      return;
    }

    this.showAnimations = false;
    setTimeout(() => this.showAnimations = true, 50);
  }

  ionViewWillLeave() {
    this.showAnimations = false;
  }
}