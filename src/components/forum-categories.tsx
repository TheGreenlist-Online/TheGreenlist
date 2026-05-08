import Link from 'next/link'

const categories = [
  {
    name: 'Cultivation',
    description: 'Growing operations, techniques, and agricultural practices',
    posts: 1247,
    lastPost: '2 hours ago'
  },
  {
    name: 'Dispensaries',
    description: 'Retail operations, customer service, and store management',
    posts: 892,
    lastPost: '1 hour ago'
  },
  {
    name: 'Policy & Legislation',
    description: 'Cannabis laws, regulations, and political developments',
    posts: 2156,
    lastPost: '30 minutes ago'
  },
  {
    name: 'Consumer Safety',
    description: 'Product quality, testing, contamination, and health concerns',
    posts: 734,
    lastPost: '4 hours ago'
  },
  {
    name: 'Industry Corruption',
    description: 'Reports of unethical practices, fraud, and corporate abuse',
    posts: 456,
    lastPost: '6 hours ago'
  },
  {
    name: 'Worker Rights',
    description: 'Labor issues, wage theft, and workplace conditions',
    posts: 321,
    lastPost: '8 hours ago'
  },
  {
    name: 'Medical Cannabis',
    description: 'Medical applications, research, and patient experiences',
    posts: 987,
    lastPost: '3 hours ago'
  },
  {
    name: 'Harm Reduction',
    description: 'Public health, safety initiatives, and education',
    posts: 654,
    lastPost: '5 hours ago'
  }
]

export function ForumCategories() {
  return (
    <div className="space-y-4">
      {categories.map((category) => (
        <div key={category.name} className="glassmorphism p-6 rounded-lg hover:neon-glow transition-all duration-300">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <Link href={`/forums/${category.name.toLowerCase().replace(/\s+/g, '-')}`}>
                <h3 className="text-xl font-semibold text-blacklist-green hover:text-white transition-colors">
                  {category.name}
                </h3>
              </Link>
              <p className="text-gray-400 mt-1">{category.description}</p>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>{category.posts} posts</div>
              <div>Last: {category.lastPost}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}