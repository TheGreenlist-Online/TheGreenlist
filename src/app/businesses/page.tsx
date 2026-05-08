import { BusinessDirectory } from '@/components/business-directory'
import { BusinessFilters } from '@/components/business-filters'

export default function BusinessesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-blacklist-green">Business Directory</h1>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <BusinessFilters />
        </div>
        <div className="lg:col-span-3">
          <BusinessDirectory />
        </div>
      </div>
    </div>
  )
}