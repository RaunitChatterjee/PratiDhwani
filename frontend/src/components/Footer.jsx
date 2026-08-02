export default function Footer() {
  return (
    <footer className="border-t border-line">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-6 py-8 text-[12px] text-muted md:flex-row">
        <p>PratiDhwani — प्रतिध्वनि · AI-powered deepfake speech detection</p>
        <p className="font-mono">Wav2Vec2 · PyTorch · FastAPI · ASVspoof 2019 LA</p>
      </div>
    </footer>
  )
}
