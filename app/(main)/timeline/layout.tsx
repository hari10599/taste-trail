import { TrendingRestaurants } from '@/components/TrendingRestaurants'

export default function TimelineLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          {children}
        </div>
        <div className="space-y-6">
          <TrendingRestaurants />
        </div>
      </div>
    </div>
  )
}