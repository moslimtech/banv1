export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen">
      {/* Main Content */}
      <div className="flex-1">
        {children}
      </div>
    </div>
  )
}
