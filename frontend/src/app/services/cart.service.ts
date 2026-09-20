import { Injectable } from '@angular/core';

export interface CartItem {
  name: string;
  price: number;
  quantity: number;
}

@Injectable({
  providedIn: 'root'
})
export class CartService {

  private getCartRaw(): any[] {
    const cartString = localStorage.getItem('smartgarden_cart');
    return JSON.parse(cartString || '[]');
  }

  getGroupedCart(): CartItem[] {
    const cart = this.getCartRaw();
    const grouped: { [key: string]: CartItem } = {};
    
    cart.forEach(item => {
      if (grouped[item.name]) {
        grouped[item.name].quantity += 1;
      } else {
        grouped[item.name] = { 
          name: item.name, 
          price: item.price, 
          quantity: 1 
        };
      }
    });
    
    return Object.values(grouped);
  }

  addToCart(name: string, price: number): void {
    const cart = this.getCartRaw();
    cart.push({ name, price });
    localStorage.setItem('smartgarden_cart', JSON.stringify(cart));
  }

  removeOne(name: string): void {
    const cart = this.getCartRaw();
    const index = cart.findIndex(item => item.name === name);
    if (index > -1) {
      cart.splice(index, 1);
      localStorage.setItem('smartgarden_cart', JSON.stringify(cart));
    }
  }

  removeAllOfItem(name: string): void {
    let cart = this.getCartRaw();
    cart = cart.filter(item => item.name !== name);
    localStorage.setItem('smartgarden_cart', JSON.stringify(cart));
  }

  clearCart(): void {
    localStorage.removeItem('smartgarden_cart');
  }

  getTotal(): number {
    return this.getGroupedCart().reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }
}