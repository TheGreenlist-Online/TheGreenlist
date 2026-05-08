'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'

export function ReportForm() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    evidence: [] as File[],
    anonymous: true
  })

  const submitReport = useMutation({
    mutationFn: async (data: typeof formData) => {
      // TODO: Implement API call
      console.log('Submitting report:', data)
      return { success: true }
    },
    onSuccess: () => {
      alert('Report submitted successfully. You will receive a confirmation code for follow-up.')
      setFormData({
        title: '',
        description: '',
        category: '',
        evidence: [],
        anonymous: true
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    submitReport.mutate(formData)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    setFormData(prev => ({ ...prev, evidence: files }))
  }

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Submit a Report</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Report Title</label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
            placeholder="Brief description of the issue"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Category</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
            required
          >
            <option value="">Select a category</option>
            <option value="safety">Product Safety</option>
            <option value="corruption">Industry Corruption</option>
            <option value="worker-rights">Worker Rights</option>
            <option value="environmental">Environmental</option>
            <option value="regulatory">Regulatory Violations</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Description</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none h-32 resize-none"
            placeholder="Detailed description of the issue, including dates, locations, and any relevant information"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Evidence (Optional)</label>
          <input
            type="file"
            multiple
            onChange={handleFileChange}
            className="w-full bg-blacklist-dark border border-gray-600 rounded-lg px-3 py-2 text-white focus:border-blacklist-green focus:outline-none"
            accept="image/*,.pdf,.doc,.docx"
          />
          <p className="text-xs text-gray-400 mt-1">
            Upload photos, documents, or other evidence. Files are encrypted and stored securely.
          </p>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.anonymous}
            onChange={(e) => setFormData(prev => ({ ...prev, anonymous: e.target.checked }))}
            className="mr-2"
          />
          <label htmlFor="anonymous" className="text-sm">
            Submit anonymously (recommended for protection)
          </label>
        </div>

        <button
          type="submit"
          disabled={submitReport.isPending}
          className="btn-primary w-full disabled:opacity-50"
        >
          {submitReport.isPending ? 'Submitting...' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}