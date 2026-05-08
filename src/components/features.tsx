export function Features() {
  const features = [
    {
      title: 'Community Forums',
      description: 'Threaded discussions on cultivation, policy, safety, and industry issues.',
      icon: '💬'
    },
    {
      title: 'Anonymous Reporting',
      description: 'Secure whistleblower system with evidence uploads and moderation.',
      icon: '�'
    },
    {
      title: 'Business Directory',
      description: 'Public profiles with transparency scores and community reviews.',
      icon: '🏢'
    },
    {
      title: 'News Aggregation',
      description: 'AI-powered news feed from cannabis policy and industry sources.',
      icon: '📰'
    },
    {
      title: 'AI Moderation',
      description: 'Automated content moderation with toxicity detection and legal review.',
      icon: '🤖'
    },
    {
      title: 'Transparency Scoring',
      description: 'Algorithmic trust metrics based on community feedback and compliance.',
      icon: '📊'
    }
  ]

  return (
    <section className="py-20 px-4 bg-blacklist-dark">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center mb-12 text-blacklist-green">
          Platform Features
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="glassmorphism p-6 rounded-lg hover:neon-glow transition-all duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-blacklist-green">
                {feature.title}
              </h3>
              <p className="text-gray-400">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}