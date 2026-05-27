import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'

export const metadata = {
  title: 'Help & FAQ - THEBLACKLIST.ONLINE',
  description: 'Frequently asked questions and help resources for THEBLACKLIST.ONLINE.',
}

export default function HelpPage() {
  const faqs = [
    {
      question: 'What is THEBLACKLIST.ONLINE?',
      answer: 'THEBLACKLIST.ONLINE is a transparency platform dedicated to cannabis industry accountability and public oversight.'
    },
    {
      question: 'How do I submit a report?',
      answer: 'Visit the Reports section to submit evidence and allegations. All submissions are reviewed for accuracy and legal compliance.'
    },
    {
      question: 'Is my identity protected?',
      answer: 'We support anonymous submissions to protect whistleblowers. All reports are reviewed with privacy and security in mind.'
    },
    {
      question: 'How are businesses reviewed?',
      answer: 'Businesses receive transparency scores based on community reports, regulatory compliance, and verified information.'
    },
  ]

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-4xl font-bold mb-6">Help & FAQ</h1>
          
          <div className="max-w-3xl">
            <div className="space-y-6">
              {faqs.map((faq, index) => (
                <div key={index} className="border border-gray-700 rounded-lg p-6 bg-gray-900">
                  <h3 className="text-lg font-bold mb-3">{faq.question}</h3>
                  <p className="text-gray-400">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-12 border border-gray-700 rounded-lg p-8 bg-gray-900">
              <h2 className="text-2xl font-bold mb-4">Still need help?</h2>
              <p className="text-gray-400 mb-4">Visit our contact page or email support for additional assistance.</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
