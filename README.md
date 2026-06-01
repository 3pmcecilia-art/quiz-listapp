# 영어 오답노트 (quiz-listapp)

React + Vite + Tailwind CSS로 만든 영어 학습 오답노트 앱입니다.

## 주요 기능

- **문장 노트**: 영어 문장을 저장하고 AI 문법 분석을 받아볼 수 있습니다.
- **문제 노트**: 틀린 문제와 정답을 저장하고 AI 문법 설명을 받아볼 수 있습니다.
- **이미지 업로드(OCR)**: 문제 이미지를 찍어 텍스트로 자동 변환합니다.
- **인라인 메모**: 카드별로 메모를 빠르게 추가/수정할 수 있습니다.
- **검색**: 문장/문제/메모를 실시간으로 검색합니다.
- **로컬 저장**: 데이터는 브라우저 localStorage에 저장됩니다.

## 기술 스택

- React 18
- Vite
- Tailwind CSS
- OpenRouter API (AI 문법 분석 / OCR)

## 시작하기

```bash
npm install
copy .env.example .env  # API 키 입력
npm run dev
```

## 환경변수

```
VITE_OPENROUTER_API_KEY=your-api-key
VITE_OCR_MODEL=google/gemini-2.5-flash-image
VITE_ANALYSIS_MODEL=anthropic/claude-haiku-4-5
```
