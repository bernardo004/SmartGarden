import { Component, Input, OnInit } from '@angular/core';
import { environment } from 'src/environments/environment';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ShippingComponent } from '../shipping/shipping.component';
import { CartService, CartItem } from '../../../services/cart.service';
import { AuthService } from '../../../services/auth.service';
import { ModalComponent } from '../../../shared/modal/modal.component';

@Component({
  selector: 'app-checkout-summary',
  standalone: true,
  imports: [CommonModule, ModalComponent],
  templateUrl: './summary.component.html',
  styleUrls: ['./summary.component.scss']
})
export class SummaryComponent implements OnInit {
  @Input() shippingComponent!: ShippingComponent;

  cartItems: CartItem[] = [];
  totalAmount = 0;

  isSuccessModalVisible = false;
  isLoginModalVisible = false;

  constructor(
    private cart: CartService,
    private auth: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.refresh();
  }

  refresh() {
    this.cartItems = this.cart.getGroupedCart();
    this.totalAmount = this.cart.getTotal();
  }

  removeOne(name: string) {
    this.cart.removeOne(name);
    this.refresh();
  }

  removeAll(name: string) {
    this.cart.removeAllOfItem(name);
    this.refresh();
  }

  async processPayment() {
    if (this.cartItems.length === 0) return;

    const isValid = this.shippingComponent.validate();
    if (!isValid) return;

    if (!this.auth.isLoggedIn()) {
      this.isLoginModalVisible = true;
      document.body.style.overflow = 'hidden';
      return;
    }

    const orderItems = this.cartItems.map(item => ({
        product: item.name,
        quantity: item.quantity,
        price: item.price
    }));

    try {
        const response = await fetch(`${environment.apiUrl}/checkout`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: this.auth.getUserEmail(), items: orderItems })
        });

        if (response.ok) {
            this.isSuccessModalVisible = true;
            document.body.style.overflow = 'hidden';
        }
    } catch (error) {
        console.error("Errore connessione:", error);
    }
  }

  onSuccessModalClose() {
    this.isSuccessModalVisible = false;
    document.body.style.overflow = 'auto';
    this.cart.clearCart();
	
    this.router.navigate(['/dashboard']);
  }

  onLoginModalClose() {
    this.isLoginModalVisible = false;
    document.body.style.overflow = 'auto';
  }

  goToLogin() {
    this.isLoginModalVisible = false;
    document.body.style.overflow = 'auto';
    this.router.navigate(['/auth/login']);
  }
}
