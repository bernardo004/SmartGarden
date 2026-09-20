import { Component, ChangeDetectorRef } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

import { NavbarComponent } from '../../core/navbar/navbar.component';
import { FooterComponent } from '../../core/footer/footer.component';
import { AnimateOnScrollDirective } from '../../shared/directives/animate-on-scroll.directive'; 
import { ProductCardComponent } from './product-card/product-card.component';


@Component({
  selector: 'app-shop',
  standalone: true,
  imports: [CommonModule, IonContent, NavbarComponent, FooterComponent, ProductCardComponent, AnimateOnScrollDirective], 
  templateUrl: './shop.page.html',
  styleUrls: ['./shop.page.scss']
})
export class ShopPage {
  recommendedProducts: any[] = [];
  allProducts: any[] = [];
  isLoading = true; 
  hasError = false; 

  activeCardId: string | null = null; 
  showAnimations = false;

  constructor(private cdr: ChangeDetectorRef) {}

  async ionViewWillEnter() {
    this.showAnimations = false;
    setTimeout(() => this.showAnimations = true, 50);

    if (this.allProducts.length === 0) {
        this.isLoading = true;
    }

    try {
        const response = await fetch(`${environment.apiUrl}/products`);
        if (response.ok) {
            const dbProducts = await response.json();
            const formattedProducts = dbProducts.map((p: any) => ({
                id: p._id || p.product,
                name: p.product,    
                stock: p.quantity,  
                price: p.price,
                image: p.image,
                description: p.description,
                manualUrl: p.manualUrl,
                isRecommended: p.isRecommended
            }));
            this.recommendedProducts = formattedProducts.filter((p: any) => p.isRecommended);
            this.allProducts = formattedProducts.filter((p: any) => !p.isRecommended);
        } else {
            this.hasError = true;
        }
    } catch (error) {
        this.hasError = true; 
    } finally {
        this.isLoading = false;
        this.cdr.detectChanges(); 
    }
  }

  ionViewWillLeave() {
      this.showAnimations = false;
  }

  handleToggle(productId: string) {
    this.activeCardId = this.activeCardId === productId ? null : productId;
  }
}