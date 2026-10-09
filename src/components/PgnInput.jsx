import { btnPrimary, btnGhost, field } from '../lib/ui'

export default function PgnInput({ text, setText, onLoad, error }) {
  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      setText(reader.result)
      onLoad(reader.result)
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-3">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste your PGN here..."
        className={`${field} w-full h-36 font-mono resize-none`}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button onClick={() => onLoad(text)} className={btnPrimary}>
          ♟ Load game
        </button>
        <label className={btnGhost}>
          📁 Upload .pgn
          <input type="file" accept=".pgn,.txt" onChange={handleFile} className="hidden" />
        </label>
      </div>
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
}