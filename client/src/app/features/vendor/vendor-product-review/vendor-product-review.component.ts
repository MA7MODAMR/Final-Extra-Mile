import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Product } from '../../../shared/models/product';
import { ProductService } from '../../../core/services/product.service';
import { ImageService } from '../../../core/services/image.service';

@Component({
  selector: 'app-vendor-product-review',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule
  ],
  templateUrl: './vendor-product-review.component.html',
  styleUrls: ['./vendor-product-review.component.scss']
})
export class VendorProductReviewComponent implements OnInit {
  product?: Product;
  productData: any = null;
  imagePreview: string | null = null;
  draggedUrls: string[] = [];
  isSubmitting = false;
  isUpdateMode = false;

  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private productService = inject(ProductService);
  private imageService = inject(ImageService);

  ngOnInit(): void {
    // Check if we have a product ID from query params (coming from product creation or update)
    const productId = this.route.snapshot.queryParamMap.get('productId');
    const isUpdate = this.route.snapshot.queryParamMap.get('isUpdate');
    
    // Set update mode flag
    this.isUpdateMode = isUpdate === 'true';
    
    if (productId) {
      // Load the created/updated product for review
      this.loadProductForReview(+productId);
    } else {
      // Check for pending product in session storage (old flow)
      const pendingProduct = sessionStorage.getItem('pendingProduct');
      if (pendingProduct) {
        const data = JSON.parse(pendingProduct);
        this.productData = data.formData;
        this.imagePreview = data.file;
      } else {
        // No pending product, redirect back to form
        this.router.navigate(['/vendor/products/new']);
      }
    }
  }

  loadProductForReview(productId: number): void {
    this.productService.getVendorProduct(productId).subscribe({
      next: (product: Product) => {
        // Convert the product data to the format expected by the review component
        this.productData = {
          name: product.name,
          description: product.description,
          price: product.price,
          type: product.type,
          brand: product.brand,
          quantity: product.quantityInStock
        };
        
        // Use the image service to get the correct image URL
        if (product.pictureUrl) {
          this.imagePreview = this.imageService.getImageUrl(product.pictureUrl);
        } else {
          this.imagePreview = null;
        }
        
        console.log('Product loaded for review:', product);
        console.log('Image preview URL:', this.imagePreview);
      },
      error: (error) => {
        console.error('Error loading product for review:', error);
        alert('Error loading product data. Please try again.');
        this.router.navigate(['/vendor/products']);
      }
    });
  }

  onEdit(): void {
    // Check if we're reviewing an existing product
    const productId = this.route.snapshot.queryParamMap.get('productId');
    
    if (productId) {
      // Navigate to edit the existing product
      this.router.navigate(['/vendor/products', productId, 'edit']);
    } else {
      // Keep the current data in session storage and navigate back to form
      this.router.navigate(['/vendor/products/new']);
    }
  }

  onPublish(): void {
    if (!this.productData) return;

    this.isSubmitting = true;

    // Check if we're reviewing an existing product
    const productId = this.route.snapshot.queryParamMap.get('productId');
    
    if (productId) {
      if (this.isUpdateMode) {
        // We're reviewing an updated product - show success message and navigate to product details
        console.log('Product updated successfully');
        alert('Product updated successfully! It is now pending admin review.');
        this.router.navigate(['/vendor/products', productId]);
      } else {
        // We're reviewing a newly created product - show success message and navigate to product details
        console.log('Product submitted for review successfully');
        alert('Product submitted for review successfully!');
        this.router.navigate(['/vendor/products', productId]);
      }
    } else {
      // We're creating a new product (old flow)
      // Create a JSON object instead of FormData for now
      // This assumes your API can handle JSON with a base64 image string
      const productPayload = {
        name: this.productData.name,
        description: this.productData.description,
        price: this.productData.price,
        type: this.getTypeName(this.productData.type),
        brand: this.getBrandName(this.productData.brand),
        quantityInStock: this.productData.quantity,
        pictureUrl: this.imagePreview // Send the base64 string directly
      };

      this.productService.addProduct(productPayload).subscribe({
        next: (response) => {
          console.log('Product published successfully', response);
          sessionStorage.removeItem('pendingProduct');
          
          // Show success message
          alert('Product published successfully! It is now pending admin review.');
          
          // Navigate to products page to see the new product
          this.router.navigate(['/vendor/products']);
        },
        error: (error) => {
          console.error('Error publishing product:', error);
          this.isSubmitting = false;
          alert('Error publishing product. Please try again.');
        }
      });
    }
  }

  onEditProduct(): void {
    if (this.product) {
      this.router.navigate(['/vendor/products', this.product.id, 'edit']);
    }
  }

  onSubmitForReview(): void {
    if (this.product) {
      // Navigate to the vendor products list
      this.router.navigate(['/vendor/products']);
    }
  }

  private getTypeName(typeId: number): string {
    const types = ['Hats', 'Ball', 'Socks', 'Gloves', 'Gym Equipment', 'Bag', 'Shoes', 'Shirt'];
    return types[typeId - 1] || 'Unknown';
  }

  private getBrandName(brandId: number): string {
    const brands = ['Nike', 'Adidas', 'Puma', 'Under Armour', 'Asics', 'New Balance', 'Reebok', 'Converse'];
    return brands[brandId - 1] || 'Unknown';
  }

  onImageError(event: any): void {
    this.imageService.handleImageError(event, this.imagePreview || '');
  }

  onImageLoad(event: any): void {
    console.log('Image loaded successfully:', event);
  }
}
