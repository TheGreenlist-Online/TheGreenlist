import { ProductGallery } from '@/components/product-gallery'
import { ProductForums } from '@/components/product-forums'

export default function ProductsPage() {
  return (
    <div className="min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <h1 className="heading-lg mb-4">Cannabis Products</h1>
        <p className="text-muted text-lg mb-12">
          Explore our community-reviewed cannabis products, strains, and concentrates.
        </p>
      </div>

      <ProductGallery />
      <ProductForums />
    </div>
  )
}