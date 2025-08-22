import { Component, inject, Input, OnInit } from '@angular/core';
import { Product } from '../../../shared/models/product';
import { CurrencyPipe, CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CartService } from '../../../core/services/cart.service';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-product-item',
  imports: [
    CommonModule,
    CurrencyPipe,
    RouterLink
  ],
  templateUrl: './product-item.component.html',
  styleUrl: './product-item.component.scss'
})
export class ProductItemComponent implements OnInit {
 @Input() product?: Product;
 cartService = inject(CartService);
 imageService = inject(ImageService);

 ngOnInit(): void {
   // No need to modify product.pictureUrl here anymore
   // The template will use the image service to get the correct URL
 }

 /**
  * Gets the image URL for the product using the image service
  */
 getProductImageUrl(): string {
   return this.imageService.getImageUrl(this.product?.pictureUrl);
 }

 /**
  * Handles image loading errors
  */
 onImageError(event: any): void {
   this.imageService.handleImageError(event, this.product?.pictureUrl || '');
 }

 /**
  * Checks if the product is new (created within the last 7 days)
  */
 isProductNew(): boolean {
   if (!this.product?.createdAt) return false;
   
   const createdAt = new Date(this.product.createdAt);
   const sevenDaysAgo = new Date();
   sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
   
   return createdAt >= sevenDaysAgo;
 }

 getProductRating(): number {
   if (!this.product) return 0;
   // Use product ID to consistently generate the same rating
   const ratingVariation = (this.product.id % 6) * 0.25; // 0, 0.25, 0.5, 0.75, 1.0, 1.25
   return 3.5 + ratingVariation; // Rating between 3.5-4.75
 }

 /**
  * Gets the vendor name for the product
  * For now, returns a placeholder based on vendorId
  * In a real implementation, this would fetch vendor details from a service
  */
 getVendorName(): string {
   if (!this.product?.vendorId) return 'Extra Mile';
   
   // For now, return a placeholder vendor name based on vendorId
   // In a real implementation, you would fetch vendor details from a service
   const vendorNames = [
     'Sports Gear Pro',
     'Athletic World',
     'Fitness First',
     'Sporty Solutions',
     'Active Lifestyle',
     'Performance Plus',
     'Elite Sports',
     'Champion Gear'
   ];
   
   // Use vendorId to consistently get the same vendor name for the same product
   const index = this.product.vendorId.length % vendorNames.length;
   return vendorNames[index];
 }

}
