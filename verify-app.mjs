import { chromium } from 'playwright'
const OUT = 'C:\\Users\\user\\AppData\\Local\\Temp'
const browser = await chromium.launch({ headless: true })
const page = await browser.newPage()
await page.setViewportSize({ width: 390, height: 812 })
await page.goto('http://localhost:5173')
await page.waitForLoadState('networkidle')
await page.evaluate(() => localStorage.clear())
await page.reload()
await page.waitForLoadState('networkidle')

// 1. 검색 바 표시 확인
const searchBar = await page.locator('input[placeholder*="검색"]').isVisible()
console.log('검색 바:', searchBar ? '✓' : '✗')

// 2. 카드 추가 → Toast 확인
await page.locator('button.fixed').click()
await page.waitForTimeout(300)
await page.locator('textarea').first().fill('The report must be submitted by Monday.')
await page.getByRole('button', { name: '저장' }).click()
await page.waitForTimeout(300)
const toast = await page.locator('[class*="rounded-full"][class*="bg-slate-800"]').isVisible().catch(() => false)
console.log('저장 Toast:', toast ? '✓' : '✗')
await page.screenshot({ path: `${OUT}\\final-1-toast.png` })

// 3. 날짜 상대 표시 확인
await page.waitForTimeout(500)
const relDate = await page.getByText('오늘').isVisible().catch(() => false)
console.log('상대 날짜("오늘"):', relDate ? '✓' : '✗')

// 4. 검색 기능 테스트
await page.locator('input[placeholder*="검색"]').fill('Monday')
await page.waitForTimeout(200)
const filteredCards = await page.locator('[class*="rounded-2xl"][class*="overflow-hidden"]').count()
console.log('검색 후 카드 수 (Monday):', filteredCards, filteredCards === 1 ? '✓' : '✗')
await page.screenshot({ path: `${OUT}\\final-2-search.png` })

// 5. 검색 결과 없음
await page.locator('input[placeholder*="검색"]').fill('xyznotfound')
await page.waitForTimeout(200)
const noResult = await page.getByText('검색 결과가 없어요.').isVisible().catch(() => false)
console.log('검색 결과 없음 상태:', noResult ? '✓' : '✗')
await page.screenshot({ path: `${OUT}\\final-3-no-result.png` })

// 6. ESC로 모달 닫기
await page.locator('input[placeholder*="검색"]').fill('')
await page.locator('button.fixed').click()
await page.waitForTimeout(300)
// 모달 고유 요소: 첫 번째 textarea (본문 입력 필드)
const modalOpen = await page.locator('textarea').first().isVisible().catch(() => false)
console.log('모달 열림:', modalOpen ? '✓' : '✗')
await page.keyboard.press('Escape')
await page.waitForTimeout(300)
const modalClosed = !(await page.locator('textarea').first().isVisible().catch(() => false))
console.log('ESC로 모달 닫힘:', modalClosed ? '✓' : '✗')

// 7. 삭제 Toast
await page.locator('button', { hasText: '삭제' }).first().click()
await page.waitForTimeout(200)
await page.getByRole('button', { name: '삭제' }).last().click()
await page.waitForTimeout(300)
const deleteToast = await page.locator('text=카드가 삭제됐어요').isVisible().catch(() => false)
console.log('삭제 Toast:', deleteToast ? '✓' : '✗')
await page.screenshot({ path: `${OUT}\\final-4-delete-toast.png` })

await browser.close()
console.log('\n검증 완료')
