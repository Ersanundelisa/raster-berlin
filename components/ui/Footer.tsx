export function Footer() {
  return (
    <footer className="border-t border-gray-100 py-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 text-sm text-gray-400 flex justify-between flex-wrap gap-4">
        <span>© {new Date().getFullYear()} Berlin Art Guide</span>
        <span>Art for Berlin locals</span>
      </div>
    </footer>
  )
}
