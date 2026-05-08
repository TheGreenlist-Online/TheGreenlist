'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'

// Mock data
const mockReports = [
  {
    id: '1',
    title: 'Product contamination in major brand',
    category: 'Safety',
    status: 'Pending',
    submitted: '2 hours ago',
    priority: 'High'
  },
  {
    id: '2',
    title: 'Worker rights violation',
    category: 'Labor',
    status: 'Under Review',
    submitted: '1 day ago',
    priority: 'Medium'
  },
  {
    id: '3',
    title: 'Regulatory compliance issue',
    category: 'Legal',
    status: 'Pending',
    submitted: '3 hours ago',
    priority: 'High'
  }
]

export function PendingReports() {
  const { data: reports } = useQuery({
    queryKey: ['pending-reports'],
    queryFn: async () => mockReports
  })

  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Pending Reports</h3>
      <div className="space-y-4">
        {reports?.map((report) => (
          <div key={report.id} className="border-b border-gray-700 pb-4 last:border-b-0">
            <div className="flex justify-between items-start mb-2">
              <Link href={`/admin/reports/${report.id}`}>
                <h4 className="font-medium text-white hover:text-blacklist-green transition-colors">
                  {report.title}
                </h4>
              </Link>
              <span className={`text-xs px-2 py-1 rounded ${
                report.priority === 'High' ? 'bg-red-900 text-red-300' :
                report.priority === 'Medium' ? 'bg-yellow-900 text-yellow-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {report.priority}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-400">
              <span>{report.category}</span>
              <span>{report.submitted}</span>
            </div>
            <div className="mt-2">
              <span className={`text-xs px-2 py-1 rounded ${
                report.status === 'Pending' ? 'bg-yellow-900 text-yellow-300' :
                report.status === 'Under Review' ? 'bg-blue-900 text-blue-300' :
                'bg-gray-700 text-gray-300'
              }`}>
                {report.status}
              </span>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6">
        <Link href="/admin/reports" className="btn-secondary w-full text-center">
          View All Reports
        </Link>
      </div>
    </div>
  )
}