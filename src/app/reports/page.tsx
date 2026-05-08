import { ReportForm } from '@/components/report-form'
import { ReportGuidelines } from '@/components/report-guidelines'

export default function ReportsPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blacklist-green">Anonymous Reporting</h1>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <ReportGuidelines />
          </div>
          <div>
            <ReportForm />
          </div>
        </div>
      </div>
    </div>
  )
}