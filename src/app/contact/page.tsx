import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Contact - THEBLACKLIST.ONLINE',
  description: 'Get in touch with the THEBLACKLIST.ONLINE team.',
}

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6">Contact Us</h1>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
              <p className="text-gray-400 mb-6">Have a question or want to report something? Contact us here.</p>
              
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input type="text" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input type="email" className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Message</label>
                  <textarea rows={5} className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-green-400"></textarea>
                </div>
                <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors">
                  Send Message
                </button>
              </form>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <div className="space-y-6">
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2">Support</h3>
                  <p className="text-gray-400">For general inquiries and support requests.</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2">Report Issues</h3>
                  <p className="text-gray-400">Report problems or submit evidence of misconduct.</p>
                </div>
                <div className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="font-bold mb-2">Business Inquiries</h3>
                  <p className="text-gray-400">For businesses to respond to reports or request reviews.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
