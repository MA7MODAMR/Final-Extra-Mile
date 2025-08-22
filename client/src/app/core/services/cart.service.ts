import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Cart, CartItem, CartTotals, Coupon } from '../../shared/models/cart';
import { Product } from '../../shared/models/product';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ImageService } from './image.service';
import { DeliveryMethod } from '../../shared/models/deliveryMethod';

@Injectable({
  providedIn: 'root'
})
export class CartService {
  private http = inject(HttpClient);
  private imageService = inject(ImageService);
  
  private cartSource = new BehaviorSubject<Cart | null>(null);
  cart$ = this.cartSource.asObservable();

  cart = signal<Cart | null>(null);
  selectedDelivery = signal<DeliveryMethod | null>(null);

  itemCount = computed(() => {
    return this.cart()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0;
  });

  totals = computed(() => {
    const cart = this.cart();
    const delivery = this.selectedDelivery();

    if (!cart) return null;
    const subtotal = cart.items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    let discountValue = 0;

    if (cart.coupon) {
      if (cart.coupon.amountOff) {
        discountValue = cart.coupon.amountOff;
      } else if (cart.coupon.percentOff) {
        discountValue = subtotal * (cart.coupon.percentOff / 100);
      }
    }

    const shipping = delivery ? delivery.price : 0;
    const total = subtotal + shipping - discountValue;

    return {
      subtotal,
      shipping,
      discount: discountValue,
      total
    };
  });

  constructor() {
    this.loadCart();
  }

  getCart(id: string): Observable<Cart> {
    return this.http.get<Cart>(`https://localhost:5001/api/basket?id=${id}`).pipe(
      map(cart => {
        this.cartSource.next(cart);
        this.cart.set(cart);
        return cart;
      })
    );
  }

  setCart(cart: Cart): Observable<Cart> {
    return this.http.post<Cart>('https://localhost:5001/api/basket', cart).pipe(
      tap(cart => {
        this.cartSource.next(cart);
        this.cart.set(cart);
      })
    );
  }

  getCurrentCartValue() {
    return this.cartSource.value;
  }

  addItemToCart(product: Product, quantity = 1) {
    const cart = this.getCurrentCartValue() ?? this.createCart();
    
    // Use the image service to get the correct image URL
    let pictureUrl = this.imageService.getImageUrl(product.pictureUrl);
    
    const item = cart.items.find(i => i.productId === product.id);
    if (item) {
      item.quantity += quantity;
    } else {
      cart.items.push({
        productId: product.id,
        productName: product.name,
        price: product.price,
        pictureUrl: pictureUrl,
        brand: product.brand,
        type: product.type,
        quantity
      });
    }

    this.setCart(cart).subscribe();
  }

  removeItemFromCart(productId: number, quantity = 1) {
    const cart = this.getCurrentCartValue();
    if (!cart) return;
    
    const item = cart.items.find(i => i.productId === productId);
    if (item) {
      item.quantity -= quantity;
      if (item.quantity === 0) {
        cart.items = cart.items.filter(i => i.productId !== productId);
      }
    }

    this.setCart(cart).subscribe();
  }

  removeItem(productId: number) {
    const cart = this.getCurrentCartValue();
    if (!cart) return;
    
    cart.items = cart.items.filter(i => i.productId !== productId);
    this.setCart(cart).subscribe();
  }

  applyDiscount(code: string): Observable<Coupon> {
    return this.http.get<Coupon>(`https://localhost:5001/api/coupons/${code}`);
  }

  private createCart(): Cart {
    const cart = new Cart();
    localStorage.setItem('cart_id', cart.id);
    return cart;
  }

  private loadCart() {
    const cartId = localStorage.getItem('cart_id');
    if (cartId) {
      this.getCart(cartId).subscribe({
        error: () => {
          localStorage.removeItem('cart_id');
        }
      });
    }
  }

  deleteCart(cart?: Cart) {
    const cartToDelete = cart || this.getCurrentCartValue();
    if (!cartToDelete) return;
    
    return this.http.delete(`https://localhost:5001/api/basket?id=${cartToDelete.id}`).subscribe({
      next: () => {
        this.cartSource.next(null);
        this.cart.set(null);
        this.selectedDelivery.set(null);
        localStorage.removeItem('cart_id');
      }
    });
  }

  deleteLocalCart() {
    this.cartSource.next(null);
    this.cart.set(null);
    this.selectedDelivery.set(null);
    localStorage.removeItem('cart_id');
  }
}
