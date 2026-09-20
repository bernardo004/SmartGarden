import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { CartService } from '../../services/cart.service';
import { ProfileDropdownComponent } from './profile-dropdown/profile-dropdown.component';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, CommonModule, ProfileDropdownComponent],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  isMenuOpen = false;

  constructor(public auth: AuthService, public cart: CartService) {}

  get cartItemCount(): number {
    return this.cart.getGroupedCart().reduce((acc, item) => acc + item.quantity, 0);
  }

  closeMenu() {
    this.isMenuOpen = false;
  }
}
