'use client'

import { useState } from 'react'

export function BusinessFilters() {
  const [filters, setFilters] = useState({
    type: '',
    location: '',
    minScore: '',
    verified: false
  })

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Filters</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Business Type</label>
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="dispensary">Dispensary</option>
            <option value="grower">Grower</option>
            <option value="lab">Lab</option>
            <option value="consultant">Consultant</option>
            <option value="equipment">Equipment Supplier</option>
            <option value="media">Media</option>
            <option value="legal">Legal/Compliance</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Location</label>
          <select
            value={filters.location}
            onChange={(e) => setFilters(prev => ({ ...prev, location: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
          >
            <option value="">All Locations</option>
            <option value="california">California</option>
            <option value="colorado">Colorado</option>
            <option value="washington">Washington</option>
            <option value="oregon">Oregon</option>
            <option value="nevada">Nevada</option>
            <option value="michigan">Michigan</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Min Transparency Score</label>
          <input
            type="number"
            min="0"
            max="10"
            step="0.1"
            value={filters.minScore}
            onChange={(e) => setFilters(prev => ({ ...prev, minScore: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
            placeholder="0.0 - 10.0"
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="verified"
            checked={filters.verified}
            onChange={(e) => setFilters(prev => ({ ...prev, verified: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="verified" className="text-sm">Verified Only</label>
        </div>

        <button className="btn-primary w-full">
          Apply Filters
        </button>
      </div>
    </div>
  )
}