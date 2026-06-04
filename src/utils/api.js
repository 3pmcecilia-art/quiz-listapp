const API_URL        = 'https://openrouter.ai/api/v1/chat/completions'
const API_KEY        = import.meta.env.VITE_OPENROUTER_API_KEY
const OCR_MODEL      = import.meta.env.VITE_OCR_MODEL      || 'anthropic/claude-sonnet-4-5'
const ANALYSIS_MODEL = import.meta.env.VITE_ANALYSIS_MODEL || 'anthropic/claude-haiku-4-5'

const TIMEOUT_MS = 30_000

// ── 공통 fetch 헬퍼 (타임아웃 + 429 재시도) ─────────────────
async function callAPI(model, messages, maxTokens = 1000, retries = 2) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens }),
      signal: controller.signal,
    })

    if (res.status === 429 && retries > 0) {
      const wait = parseInt(res.headers.get('retry-after') || '2', 10)
      await new Promise((r) => setTimeout(r, wait * 1000))
      return callAPI(model, messages, maxTokens, retries - 1)
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err?.error?.message || `API 오류 (${res.status})`)
    }

    const data = await res.json()
    return data.choices[0].message.content.trim()
  } catch (err) {
    if (err.name === 'AbortError') throw new Error('요청 시간이 초과됐어요 (30초)')
    throw err
  } finally {
    clearTimeout(timer)
  }
}

// ── 이미지 → base64 ──────────────────────────────────────
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload  = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ── OCR: 이미지에서 텍스트 추출 ──────────────────────────
export async function extractTextFromImage(file) {
  const base64    = await fileToBase64(file)
  const mediaType = file.type || 'image/jpeg'
  return callAPI(OCR_MODEL, [
    {
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mediaType};base64,${base64}` } },
        { type: 'text', text: '이 이미지에서 텍스트를 그대로 추출해줘. 텍스트만 반환하고 다른 설명은 하지 마.' },
      ],
    },
  ])
}

// ── 문법 분석 ────────────────────────────────────────────
const SENTENCE_PROMPT = (sentence) => `다음 영어 문장을 분석해줘.
문장: ${sentence}
아래 형식의 JSON으로만 응답해. 다른 텍스트는 포함하지 마.
{
  "grammarPoint": "문법 이름 (영어명)",
  "grammarPointKo": "문법 이름 (한국어명)",
  "explanation": "이 문장에서 해당 문법이 어떻게 쓰였는지 한국어로 3-4문장 설명",
  "examples": [
    {"sentence": "예문1", "translation": "해석1"},
    {"sentence": "예문2", "translation": "해석2"},
    {"sentence": "예문3", "translation": "해석3"}
  ]
}`

const PROBLEM_PROMPT = (problem) => `다음 영어 문법 문제를 분석해줘.
문제: ${problem}
아래 형식의 JSON으로만 응답해. 다른 텍스트는 포함하지 마.
{
  "grammarPoint": "문법 이름 (영어명)",
  "grammarPointKo": "문법 이름 (한국어명)",
  "explanation": "어떤 문법을 몰라서 틀리기 쉬운지, 핵심 규칙을 한국어로 3-4문장 설명",
  "similarProblems": [
    {"question": "유사문제1", "answer": "정답1", "explanation": "해설1"},
    {"question": "유사문제2", "answer": "정답2", "explanation": "해설2"},
    {"question": "유사문제3", "answer": "정답3", "explanation": "해설3"}
  ]
}`

export async function analyzeGrammar(type, card) {
  const prompt = type === 'sentence'
    ? SENTENCE_PROMPT(card.sentence)
    : PROBLEM_PROMPT(card.problem)

  const text = await callAPI(ANALYSIS_MODEL, [{ role: 'user', content: prompt }], 1200)

  // JSON 파싱 (마크다운 코드블록 제거 후)
  const clean = text.replace(/```(?:json)?/g, '').trim()
  const match = clean.match(/\{[\s\S]*\}/)
  if (!match) throw new Error('JSON 파싱 실패')
  return JSON.parse(match[0])
}
