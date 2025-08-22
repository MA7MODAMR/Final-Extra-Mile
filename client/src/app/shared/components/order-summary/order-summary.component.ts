import { Component, inject } from '@angular/core';
import { CartService } from '../../../core/services/cart.service';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { MatInput } from '@angular/material/input';
import { CurrencyPipe, Location } from '@angular/common';
import { StripeService } from '../../../core/services/stripe.service';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { Coupon } from '../../../shared/models/cart';

@Component({
  selector: 'app-order-summary',
  imports: [
    MatFormField,
    MatLabel,
    MatButton,
    RouterLink,
    MatInput, 
    CurrencyPipe,
    FormsModule,
    MatIcon
  ],
  templateUrl: './order-summary.component.html',
  styleUrl: './order-summary.component.scss'
})
export class OrderSummaryComponent {
  cartService = inject(CartService);
  private stripeService = inject(StripeService);
  location = inject(Location);
  code?: string;

  applyCouponCode() {
    if (!this.code) return;
    this.cartService.applyDiscount(this.code).subscribe({
      next: (coupon: Coupon) => {
        const cart = this.cartService.cart();
        if (cart) {
          cart.coupon = coupon;
          this.cartService.setCart(cart).subscribe(() => {
            this.code = undefined;
            if (this.location.path() === '/checkout') {
              this.stripeService.createOrUpdatePaymentIntent().subscribe();
            }
          });
        }
      }
    });
  }

  removeCouponCode() {
    const cart = this.cartService.cart();
    if (!cart) return;
    if (cart.coupon) cart.coupon = undefined;
    this.cartService.setCart(cart).subscribe(() => {
      if (this.location.path() === '/checkout') {
        this.stripeService.createOrUpdatePaymentIntent().subscribe();
      }
    });
  }
}
