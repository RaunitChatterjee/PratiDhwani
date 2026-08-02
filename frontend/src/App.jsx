import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Dashboard from './pages/Dashboard'
import BackgroundFX from './components/BackgroundFX'

export default function App() {
  return (
    <div className="relative flex min-h-screen flex-col bg-bg text-ink">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-[13px] focus:text-white"
      >
        Skip to main content
      </a>
      <BackgroundFX />
      <div className="relative z-10 flex min-h-screen flex-col">
        <Navbar />
        <main id="main-content" className="flex-1">
          <Dashboard />
        </main>
        <Footer />
      </div>
    </div>
  )
}
