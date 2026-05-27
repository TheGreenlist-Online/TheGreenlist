import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Submit Report - THEBLACKLIST.ONLINE',
  description: 'Submit a confidential report about cannabis industry misconduct.',
}

export default function ReportPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <h1 className="text-4xl font-bold mb-6">Submit a Report</h1>
          
          <div className="mb-8 p-6 border border-yellow-700 bg-yellow-900 bg-opacity-20 rounded-lg">
            <p className="text-yellow-400">
              All reports are confidential and reviewed for accuracy, legality, and compliance. Evidence of illegal activity may be reported to authorities.
            </p>
          </div>

          <form className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Report Type</label>
              <select className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-400">
                <option>Select report type</option>
                <option>Business Misconduct</option>
                <option>Product Safety Concern</option>
                <option>Labor Violation</option>
                <option>Environmental Concern</option>
                <option>Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Business Name (if applicable)</label>
              <input type="text" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400" />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Detailed Description</label>
              <textarea rows={8} placeholder="Provide specific details, dates, and evidence..." className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Contact Information (Optional)</label>
              <input type="email" placeholder="Leave blank for anonymous submission" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400" />
            </div>

            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              Submit Report
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  )
}
