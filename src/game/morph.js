// The "content morph": harvest real words from the visible page so enemy ships
// can be built out of the portfolio's own text. Also used by the rebuild ticker.

const SELECTORS = [
  '.masthead-name', '.home-name', '.ab-name', '.detail-title',
  '.lg-title', '.masthead-nav a', '.ab-exp-role', '.tag-row li', '.kicker',
  'h1', 'h2', 'h3',
]

const FALLBACK = [
  'NISHANT', 'PORTFOLIO', 'CONTENTOS', 'CROSSBEAN', 'GPU', 'PYTORCH',
  'REACT', 'SUPABASE', 'AGENTS', 'RAG', 'GEMINI', 'VERCEL', 'ASCII', 'ROCKET',
]

export function collectWords() {
  const seen = new Set()
  const words = []
  try {
    for (const sel of SELECTORS) {
      for (const el of document.querySelectorAll(sel)) {
        for (const raw of (el.textContent || '').split(/[\s—·|/,]+/)) {
          const w = raw.replace(/[^A-Za-z0-9.+#-]/g, '').toUpperCase()
          if (w.length >= 2 && w.length <= 10 && !seen.has(w)) {
            seen.add(w)
            words.push(w)
          }
          if (words.length >= 48) break
        }
      }
    }
  } catch { /* SSR / detached DOM */ }
  return words.length >= 8 ? words : FALLBACK
}
