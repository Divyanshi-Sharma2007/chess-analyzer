export function winPercent(cp) {
  return 50 + 50 * (2 / (1 + Math.exp(-0.00368 * cp)) - 1)
}

export default function EvalBar({ result }) {
  let white = 50
  let label = '0.0'

  if (result) {
    if (result.mate !== null) {
      white = result.mate > 0 ? 100 : 0
      label = 'M' + Math.abs(result.mate)
    } else {
      white = winPercent(result.cp)
      label = (Math.abs(result.cp) / 100).toFixed(1)
    }
  }

  return (
    <div className="relative w-7 sm:w-8 self-stretch min-h-[200px] bg-slate-700 rounded-lg overflow-hidden border border-white/10 shadow-inner">
      <div
        className="absolute bottom-0 w-full bg-gradient-to-t from-slate-100 to-white transition-all duration-500"
        style={{ height: `${white}%` }}
      />
      <span className="absolute top-1 left-0 w-full text-center text-[10px] font-bold text-slate-200">
        {white < 50 ? label : ''}
      </span>
      <span className="absolute bottom-1 left-0 w-full text-center text-[10px] font-bold text-slate-700">
        {white >= 50 ? label : ''}
      </span>
    </div>
  )
}