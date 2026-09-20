import { Component, Input, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CartService } from '../../../services/cart.service'; 

@Component({
  selector: 'app-product-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-card.component.html',
  styleUrls: ['./product-card.component.scss']
})
export class ProductCardComponent {
  @Input() product: any;
  @Input() isActive: boolean = false; 
  @Output() toggleCardEvent = new EventEmitter<void>();

  buttonText = 'Aggiungi al carrello'; 

  constructor(private cart: CartService, private cdr: ChangeDetectorRef) {}
  
  toggleCard(event: Event) {
    if ((event.target as HTMLElement).closest('.btn')) {
        return; 
    }
    this.toggleCardEvent.emit();
  }

  addToCart(event: Event) {
    event.stopPropagation(); 
    this.cart.addToCart(this.product.name, this.product.price);

    this.buttonText = "Aggiunto!";
    
    setTimeout(() => {
        this.buttonText = "Aggiungi al carrello";
        this.cdr.detectChanges();
    }, 1000); 
  }
}