import BottomNav from '@/app/components/BottomNav'

export default function InternalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {children}
      <BottomNav />
    </div>
  )
}
