import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-bg text-ink">
      <Navbar />
      <main className="flex-1">
        <Dashboard />
      </main>
      <Footer />
    </div>
  )
}
