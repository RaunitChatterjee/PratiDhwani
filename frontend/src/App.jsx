import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import BackgroundFX from './components/BackgroundFX'

export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg text-ink">
      <BackgroundFX />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1">
          <Dashboard />
        </main>
        <Footer />
      </div>
    </div>
  )
}
