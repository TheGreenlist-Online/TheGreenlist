export function ReportGuidelines() {
  return (
    <div className="glassmorphism p-6 rounded-lg">
      <h3 className="text-xl font-semibold mb-4 text-blacklist-green">Whistleblower Guidelines</h3>
      <div className="space-y-4 text-sm">
        <div>
          <h4 className="font-medium text-white mb-2">What to Report</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Product contamination or safety issues</li>
            <li>Illegal activities or regulatory violations</li>
            <li>Worker rights violations</li>
            <li>Corporate fraud or corruption</li>
            <li>Deceptive marketing practices</li>
            <li>Environmental violations</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-white mb-2">Your Protection</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Complete anonymity guaranteed</li>
            <li>Encrypted submissions</li>
            <li>Metadata stripping</li>
            <li>Legal protection under whistleblower laws</li>
            <li>No requirement to provide personal information</li>
          </ul>
        </div>
        <div>
          <h4 className="font-medium text-white mb-2">What Happens Next</h4>
          <ul className="list-disc list-inside text-gray-400 space-y-1">
            <li>Reports reviewed by trained moderators</li>
            <li>Verified reports may be escalated to authorities</li>
            <li>Anonymous follow-up available</li>
            <li>Status updates provided if requested</li>
          </ul>
        </div>
        <div className="border-t border-gray-700 pt-4">
          <p className="text-yellow-400 text-xs">
            <strong>Important:</strong> This platform does not facilitate cannabis commerce.
            Reports are for transparency and public safety purposes only.
          </p>
        </div>
      </div>
    </div>
  )
}