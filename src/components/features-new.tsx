export function Features() {
  const features = [
    {
      title: 'Product Reviews',
      description: 'Share and read detailed reviews on strains and products.',
      icon: '⭐'
    },
    {
      title: 'Strain Database',
      description: 'Explore comprehensive information on effects and profiles.',
      icon: '🌿'
    },
    {
      title: 'Community Forums',
      description: 'Join product-specific communities and general discussions.',
      icon: '💬'
    },
    {
      title: 'Dispensary Finder',
      description: 'Browse trusted dispensaries and their offerings.',
      icon: '📍'
    },
    {
      title: 'Safety Reports',
      description: 'Real discussions about testing and product safety.',
      icon: '🛡️'
    },
    {
      title: 'Industry News',
      description: 'Stay updated on policy changes and market trends.',
      icon: '📰'
    }
  ]

  return (
    <section className="py-20 px-4 bg-blacklist-gray/50">
      <div className="container mx-auto">
        <h2 className="heading-lg text-center mb-12">
          Why Choose Theblacklist
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="card-elevated p-8 rounded-lg hover:accent-glow transition-all duration-300">
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-xl font-semibold mb-2 text-blacklist-text">
                {feature.title}
              </h3>
              <p className="text-muted">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}