import { SectionCard } from '@/components/SectionCard'
import { formatRupees } from '@/lib/format'
import { mockProperties } from '@/lib/mock-data'

export default function PropertiesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-medium text-gray-900">Properties</h1>
        <p className="mt-1 text-sm text-gray-500">
          Available listings and floor-price-aware inventory.
        </p>
      </div>

      <SectionCard title="Property Inventory" subtitle="Phase 1 listing and matching foundation">
        <div className="space-y-3">
          {mockProperties.map((property) => (
            <div key={property._id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-medium text-gray-900">{property.title}</h2>
                  <p className="mt-1 text-xs text-gray-500">
                    {property.location} · Block {property.block} · {property.configuration}
                  </p>
                </div>
                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                  {property.dealType}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div>
                  <p className="text-xs text-gray-400">Floor price</p>
                  <p className="text-sm font-medium text-gray-900">{formatRupees(property.floorPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Listed price</p>
                  <p className="text-sm font-medium text-gray-900">{formatRupees(property.listedPrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Type</p>
                  <p className="text-sm font-medium text-gray-900">{property.propertyType}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Status</p>
                  <p className="text-sm font-medium text-gray-900">{property.ownershipStatus}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  )
}
