import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { Product } from '../../../shared/models/product';
import { ProductService } from '../../../core/services/product.service';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-product-details',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    ReactiveFormsModule,
    FormsModule
  ],
  templateUrl: './product-details.component.html',
  styleUrls: ['./product-details.component.scss']
})
export class ProductDetailsComponent implements OnInit {
  product?: Product;
  quantity: number = 1;
  quantityInCart: number = 0;
  addToCartForm: FormGroup;
  imageUrl: string = '';

  private route = inject(ActivatedRoute);
  private productService = inject(ProductService);
  private cartService = inject(CartService);
  private imageService = inject(ImageService);
  private fb = inject(FormBuilder);

  constructor() {
    this.addToCartForm = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.productService.getProduct(+id).subscribe({
        next: (product: Product) => {
          this.product = product;
          // Use the image service to get the correct image URL
          this.imageUrl = this.imageService.getImageUrl(product.pictureUrl);
          this.updateQuantityInCart();
        },
        error: (error) => {
          console.error('Error loading product:', error);
        }
      });
    }
  }

  addToCart(): void {
    if (this.product && this.addToCartForm.valid) {
      const quantity = this.addToCartForm.get('quantity')?.value || 1;
      this.cartService.addItemToCart(this.product, quantity);
      this.updateQuantityInCart();
    }
  }

  updateCart(): void {
    if (!this.product) return;

    if (this.quantity > this.quantityInCart) {
      const itemsToAdd = this.quantity - this.quantityInCart;
      this.cartService.addItemToCart(this.product, itemsToAdd);
    } else {
      const itemsToRemove = this.quantityInCart - this.quantity;
      this.cartService.removeItemFromCart(this.product.id, itemsToRemove);
    }
    this.quantityInCart = this.quantity;
  }

  updateQuantityInCart(): void {
    const cart = this.cartService.cart();
    if (this.product && cart) {
      const item = cart.items.find(i => i.productId === this.product?.id);
      this.quantityInCart = item ? item.quantity : 0;
    } else {
      this.quantityInCart = 0;
    }
    this.quantity = this.quantityInCart > 0 ? this.quantityInCart : 1;
  }

  getButtonText(): string {
    return this.quantityInCart > 0 ? 'Update Cart' : 'Add to Cart';
  }

  onImageError(event: any): void {
    this.imageService.handleImageError(event, this.product?.pictureUrl || '');
  }
}
