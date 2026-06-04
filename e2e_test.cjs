/**
 * 영어 오답노트 앱 - 전체 기능 E2E 테스트
 * React 18 controlled inputs → pressSequentially 사용
 */
const { chromium } = require('./node_modules/playwright-core');

const BASE_URL = 'http://localhost:5173';
let passed = 0;
let failed = 0;
const results = [];

function log(icon, msg) { console.log(`${icon} ${msg}`); }

function assert(condition, name, detail = '') {
  if (condition) {
    passed++;
    results.push({ status: 'PASS', name });
    log('✅', name);
  } else {
    failed++;
    results.push({ status: 'FAIL', name, detail });
    log('❌', `${name}${detail ? ' — ' + detail : ''}`);
  }
}

// React 18 controlled input 안전 입력 헬퍼
async function reactFill(locator, value) {
  await locator.click({ clickCount: 3 }); // 전체 선택
  await locator.pressSequentially(value, { delay: 10 });
}

// alertdialog 내부 삭제 확인 버튼 클릭
async function confirmDelete(page) {
  await page.locator('[role="alertdialog"] button:has-text("삭제")').click();
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page    = await browser.newPage();

  const jsErrors = [];
  page.on('pageerror', e => jsErrors.push(e.message));

  await page.goto(BASE_URL);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await page.waitForLoadState('networkidle');

  log('\n', '─'.repeat(55));
  log('🧪', '영어 오답노트 E2E 테스트 시작');
  log('', '─'.repeat(55));

  // ────────────────────────────────────────────────────────
  // [1] 초기 상태
  // ────────────────────────────────────────────────────────
  log('\n📋', '[1] 초기 상태');

  assert(await page.$('button:has-text("문장 노트")') !== null, '문장 노트 탭 존재');
  assert(await page.$('button:has-text("문제 노트")') !== null, '문제 노트 탭 존재');

  const ct0 = await page.$$eval('div.flex.items-center.gap-1', els => els.map(el => el.textContent.trim()));
  assert(ct0.some(t => t.includes('문장') && t.includes('0')), '초기 문장 카운트 = 0');
  assert(await page.$('text="아직 저장된 문장 노트가 없어요."') !== null, '문장 EmptyState 표시');
  await page.screenshot({ path: './test_01_initial.png' });

  // ────────────────────────────────────────────────────────
  // [2] 문장 추가
  // ────────────────────────────────────────────────────────
  log('\n📋', '[2] 문장 추가');

  await page.click('button:has-text("문장 추가")');
  await page.waitForSelector('[role="dialog"]');

  assert(await page.$('[role="dialog"]') !== null, '모달 열림 (role=dialog)');
  assert((await page.$eval('#modal-title', el => el.textContent)).includes('문장 추가'), '모달 타이틀: 문장 추가');

  const saveBtn = page.locator('button[type="submit"]');
  assert(await saveBtn.isDisabled(), '빈 폼 → 저장 버튼 비활성화');

  const sentenceTA = page.locator('textarea[placeholder="영어 문장을 입력하세요"]');
  await reactFill(sentenceTA, 'She has been working here for three years.');
  assert(!(await saveBtn.isDisabled()), '문장 입력 후 저장 버튼 활성화');

  await reactFill(
    page.locator('textarea[placeholder="문법 포인트, 해석 등 메모를 입력하세요 (선택)"]'),
    '현재완료 진행형'
  );
  await saveBtn.click();
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  assert(await page.$('[role="dialog"]') === null, '저장 후 모달 닫힘');
  assert(await page.$('text="She has been working here for three years."') !== null, '저장된 문장 카드 렌더링');

  // 두 번째 문장 추가
  await page.click('button:has-text("문장 추가")');
  await page.waitForSelector('[role="dialog"]');
  await reactFill(
    page.locator('textarea[placeholder="영어 문장을 입력하세요"]'),
    'Had I known the truth, I would have acted differently.'
  );
  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  const ct1 = await page.$$eval('div.flex.items-center.gap-1', els => els.map(el => el.textContent.trim()));
  assert(ct1.some(t => t.includes('문장') && t.includes('2')), '헤더 문장 카운트 = 2');
  await page.screenshot({ path: './test_02_sentence_added.png' });

  // ────────────────────────────────────────────────────────
  // [3] 문장 검색
  // ────────────────────────────────────────────────────────
  log('\n📋', '[3] 문장 검색');

  const searchInput = page.locator('#search-input');
  await reactFill(searchInput, '현재완료');
  await page.waitForTimeout(200);
  const filtered1 = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(filtered1 === 1, `검색 필터링 (1개): 실제 ${filtered1}개`);

  await reactFill(searchInput, '존재하지않는검색어xyz');
  await page.waitForTimeout(200);
  assert(await page.$('text="검색 결과가 없어요."') !== null, '검색 결과 없음 표시');

  const clearSearchBtn = page.locator('button:has-text("검색 초기화")');
  assert(await clearSearchBtn.isVisible(), '"검색 초기화" 버튼 표시');
  await clearSearchBtn.click();
  await page.waitForTimeout(200);
  assert(await searchInput.inputValue() === '', '검색 초기화 후 입력값 빔');

  const allCards1 = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(allCards1 === 2, `초기화 후 전체 카드 (2개): 실제 ${allCards1}개`);

  await reactFill(searchInput, 'test');
  await page.waitForTimeout(100);
  const clearXBtn = page.locator('button[aria-label="검색어 지우기"]');
  assert(await clearXBtn.isVisible(), '✕ 지우기 버튼 표시');
  await clearXBtn.click();
  await page.waitForTimeout(100);
  assert(await searchInput.inputValue() === '', '✕ 클릭 후 검색어 지워짐');
  await page.screenshot({ path: './test_03_search.png' });

  // ────────────────────────────────────────────────────────
  // [4] 문장 수정
  // ────────────────────────────────────────────────────────
  log('\n📋', '[4] 문장 수정');

  await page.locator('button:has-text("수정")').first().click();
  await page.waitForSelector('[role="dialog"]');

  assert(await page.$('[role="dialog"]') !== null, '수정 모달 열림');
  assert((await page.$eval('#modal-title', el => el.textContent)).includes('카드 수정'), '모달 타이틀: 카드 수정');

  const editTA = page.locator('textarea[placeholder="영어 문장을 입력하세요"]');
  const existingVal = await editTA.inputValue();
  assert(existingVal.length > 0, `기존 내용 로드됨: "${existingVal.slice(0, 40)}"`);

  const newSentence = 'Had I known the truth earlier, I would have acted differently.';
  await reactFill(editTA, newSentence);

  // 저장 전 폼 값 확인
  const valAfterFill = await editTA.inputValue();
  assert(valAfterFill === newSentence, `fill 후 textarea 값 확인: "${valAfterFill.slice(0, 40)}"`);

  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  await page.waitForSelector('text="Had I known the truth earlier"', { timeout: 5000 });
  assert(await page.$('text="Had I known the truth earlier"') !== null, '수정된 내용 카드에 반영');
  await page.screenshot({ path: './test_04_sentence_edit.png' });

  // ────────────────────────────────────────────────────────
  // [5] 인라인 메모 수정 (Ctrl+Enter)
  // ────────────────────────────────────────────────────────
  log('\n📋', '[5] 인라인 메모 수정');

  const memoAddBtn = page.locator('button:has-text("메모 추가")').first();
  if (await memoAddBtn.isVisible()) {
    await memoAddBtn.click();
    await page.waitForTimeout(200);
    const memoTA = page.locator('textarea[placeholder*="메모를 입력하세요"]').first();
    assert(await memoTA.isVisible(), '메모 편집 textarea 활성화');
    await memoTA.pressSequentially('가정법 과거완료 도치', { delay: 10 });
    await page.keyboard.press('Control+Enter');
    await page.waitForTimeout(300);
    assert(await page.$('text="가정법 과거완료 도치"') !== null, 'Ctrl+Enter로 메모 저장됨');
  } else {
    log('   ', '메모 추가 버튼 없음 - 스킵');
  }

  // ────────────────────────────────────────────────────────
  // [6] ESC 키 동작
  // ────────────────────────────────────────────────────────
  log('\n📋', '[6] ESC 키 동작');

  await page.click('button:has-text("문장 추가")');
  await page.waitForSelector('[role="dialog"]');
  assert(await page.$('[role="dialog"]') !== null, 'ESC 테스트: 모달 열림');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  assert(await page.$('[role="dialog"]') === null, 'ESC로 모달 닫힘');

  // ────────────────────────────────────────────────────────
  // [7] 문장 삭제
  // ────────────────────────────────────────────────────────
  log('\n📋', '[7] 문장 삭제');

  const countBefore7 = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;

  await page.locator('button:has-text("삭제")').first().click();
  await page.waitForSelector('[role="alertdialog"]');

  assert(await page.$('[role="alertdialog"]') !== null, '삭제 확인 다이얼로그 (role=alertdialog)');
  assert(await page.$('#confirm-title') !== null, 'confirm-title 연결');

  const focusedText = await page.evaluate(() => document.activeElement?.textContent?.trim());
  assert(focusedText === '취소', `취소 버튼 자동 포커스: "${focusedText}"`);

  // ESC로 취소
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="alertdialog"]', { state: 'detached' });
  assert(await page.$('[role="alertdialog"]') === null, 'ESC로 삭제 취소');
  assert((await page.$$('.bg-white.rounded-2xl.shadow-sm')).length === countBefore7, '취소 후 카드 수 유지');

  // 실제 삭제
  await page.locator('button:has-text("삭제")').first().click();
  await page.waitForSelector('[role="alertdialog"]');
  await confirmDelete(page);
  await page.waitForSelector('[role="alertdialog"]', { state: 'detached' });
  await page.waitForTimeout(200);

  const countAfter7 = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(countAfter7 === countBefore7 - 1, `삭제 후 카드 감소: ${countBefore7} → ${countAfter7}`);
  assert(await page.$('.rounded-full.shadow-lg') !== null, '삭제 후 토스트 알림');
  await page.screenshot({ path: './test_07_delete.png' });

  // ────────────────────────────────────────────────────────
  // [8] 문제 탭 전환
  // ────────────────────────────────────────────────────────
  log('\n📋', '[8] 문제 노트 탭 전환');

  await page.click('button:has-text("문제 노트")');
  await page.waitForTimeout(300);
  assert(await page.$('text="아직 저장된 문제 노트가 없어요."') !== null, '문제 EmptyState 표시');
  await page.screenshot({ path: './test_08_problem_tab.png' });

  // ────────────────────────────────────────────────────────
  // [9] 문제 추가
  // ────────────────────────────────────────────────────────
  log('\n📋', '[9] 문제 추가');

  await page.click('button:has-text("문제 추가")');
  await page.waitForSelector('[role="dialog"]');
  assert((await page.$eval('#modal-title', el => el.textContent)).includes('문제 추가'), '문제 추가 모달 타이틀');

  // 문제만 입력 → 정답 필수
  await reactFill(
    page.locator('textarea[placeholder="문제를 입력하세요"]'),
    'She ___ (study) English for five years.'
  );
  assert(await page.locator('button[type="submit"]').isDisabled(), '정답 없으면 저장 비활성화');

  const answerInput = page.locator('input[placeholder="정답을 입력하세요"]');
  assert(await answerInput.isVisible(), '정답 입력 필드 존재');
  await reactFill(answerInput, 'has studied');
  assert(!(await page.locator('button[type="submit"]').isDisabled()), '문제+정답 입력 후 저장 활성화');

  await reactFill(
    page.locator('textarea[placeholder="왜 틀렸는지 이유를 적어보세요 (선택)"]'),
    '현재완료: have/has + p.p.'
  );
  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  assert(await page.$('text="She ___ (study) English for five years."') !== null, '저장된 문제 카드 렌더링');
  assert(await page.$('text="has studied"') !== null, '저장된 정답 카드에 표시');

  // 두 번째 문제
  await page.click('button:has-text("문제 추가")');
  await page.waitForSelector('[role="dialog"]');
  await reactFill(
    page.locator('textarea[placeholder="문제를 입력하세요"]'),
    'The number of students ___ (be) increasing.'
  );
  await reactFill(page.locator('input[placeholder="정답을 입력하세요"]'), 'is');
  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  const probCards = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(probCards === 2, `문제 카드 2개: 실제 ${probCards}개`);
  const ct2 = await page.$$eval('div.flex.items-center.gap-1', els => els.map(el => el.textContent.trim()));
  assert(ct2.some(t => t.includes('문제') && t.includes('2')), '헤더 문제 카운트 = 2');
  await page.screenshot({ path: './test_09_problem_added.png' });

  // ────────────────────────────────────────────────────────
  // [10] 문제 검색
  // ────────────────────────────────────────────────────────
  log('\n📋', '[10] 문제 검색');

  const pSearchInput = page.locator('#search-input');
  await reactFill(pSearchInput, 'number');
  await page.waitForTimeout(200);
  const filteredP = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(filteredP === 1, `문제 검색 (1개): 실제 ${filteredP}개`);
  await pSearchInput.click({ clickCount: 3 });
  await pSearchInput.press('Backspace');
  await page.waitForTimeout(100);

  // ────────────────────────────────────────────────────────
  // [11] 문제 수정
  // ────────────────────────────────────────────────────────
  log('\n📋', '[11] 문제 수정');

  await page.locator('button:has-text("수정")').first().click();
  await page.waitForSelector('[role="dialog"]');
  assert(await page.$('[role="dialog"]') !== null, '문제 수정 모달 열림');

  const pEditTA = page.locator('textarea[placeholder="문제를 입력하세요"]');
  const pEditVal = await pEditTA.inputValue();
  assert(pEditVal.length > 0, `기존 문제 로드: "${pEditVal.slice(0, 30)}"`);

  const pAnswerEdit = page.locator('input[placeholder="정답을 입력하세요"]');
  await reactFill(pAnswerEdit, 'is (단수 취급)');
  assert(await pAnswerEdit.inputValue() === 'is (단수 취급)', '정답 수정 값 확인');

  await page.click('button[type="submit"]');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  await page.waitForSelector('text="is (단수 취급)"', { timeout: 5000 });
  assert(await page.$('text="is (단수 취급)"') !== null, '수정된 정답 카드에 반영');
  await page.screenshot({ path: './test_11_problem_edit.png' });

  // ────────────────────────────────────────────────────────
  // [12] 문제 삭제
  // ────────────────────────────────────────────────────────
  log('\n📋', '[12] 문제 삭제');

  const pCountBefore = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  await page.locator('button:has-text("삭제")').first().click();
  await page.waitForSelector('[role="alertdialog"]');
  assert(await page.$('[role="alertdialog"]') !== null, '문제 삭제 확인 다이얼로그');

  await confirmDelete(page);
  await page.waitForSelector('[role="alertdialog"]', { state: 'detached' });
  await page.waitForTimeout(200);

  const pCountAfter = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(pCountAfter === pCountBefore - 1, `문제 삭제 후 카드 감소: ${pCountBefore} → ${pCountAfter}`);
  await page.screenshot({ path: './test_12_problem_deleted.png' });

  // ────────────────────────────────────────────────────────
  // [13] 탭 전환 & localStorage 영속성
  // ────────────────────────────────────────────────────────
  log('\n📋', '[13] 탭 전환 & 영속성');

  await page.click('button:has-text("문장 노트")');
  await page.waitForTimeout(300);
  const sentenceCount = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(sentenceCount >= 1, `탭 전환 후 문장 카드 유지: ${sentenceCount}개`);

  await page.click('button:has-text("문제 노트")');
  await page.waitForTimeout(300);
  const problemCount = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(problemCount >= 1, `탭 전환 후 문제 카드 유지: ${problemCount}개`);

  // 새로고침 후 localStorage 복원
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.click('button:has-text("문제 노트")');
  await page.waitForTimeout(300);
  const reloadCount = (await page.$$('.bg-white.rounded-2xl.shadow-sm')).length;
  assert(reloadCount >= 1, `새로고침 후 localStorage 복원: ${reloadCount}개`);
  await page.screenshot({ path: './test_13_persistence.png' });

  // ────────────────────────────────────────────────────────
  // [14] 입력 방식 탭 & 이미지 업로드 UI
  // ────────────────────────────────────────────────────────
  log('\n📋', '[14] 입력 방식 탭 & 드래그 앤 드롭 UI');

  await page.click('button:has-text("문제 추가")');
  await page.waitForSelector('[role="dialog"]');

  assert(await page.$('[role="tablist"]') !== null, '입력 방식 tablist 존재');
  const tabs = await page.$$('[role="tab"]');
  assert(tabs.length === 2, `탭 버튼 2개: 실제 ${tabs.length}개`);

  const imgTab = page.locator('[role="tab"]:has-text("이미지 업로드")');
  await imgTab.click();
  await page.waitForTimeout(200);
  assert(await imgTab.getAttribute('aria-selected') === 'true', '이미지 탭 aria-selected=true');
  assert(
    await page.$('text="클릭하거나 이미지를 드래그하여 업로드"') !== null,
    '드래그 앤 드롭 안내 텍스트 표시'
  );

  await page.click('button:has-text("취소")');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });
  assert(await page.$('[role="dialog"]') === null, '취소 버튼으로 모달 닫힘');

  // ────────────────────────────────────────────────────────
  // [15] 미리보기 토글
  // ────────────────────────────────────────────────────────
  log('\n📋', '[15] 미리보기 토글');

  await page.click('button:has-text("문장 추가")');
  await page.waitForSelector('[role="dialog"]');
  await reactFill(
    page.locator('textarea[placeholder="영어 문장을 입력하세요"]'),
    'The early bird catches the worm.'
  );
  await page.waitForTimeout(100);

  const previewBtn = page.locator('button:has-text("미리보기")');
  assert(await previewBtn.isVisible(), '미리보기 버튼 표시');
  assert(await previewBtn.getAttribute('aria-expanded') === 'false', '미리보기 초기: aria-expanded=false');
  await previewBtn.click();
  await page.waitForTimeout(100);
  assert(await page.$('text="카드 미리보기"') !== null, '미리보기 패널 열림');
  assert(await previewBtn.getAttribute('aria-expanded') === 'true', '미리보기 열림: aria-expanded=true');
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  // ────────────────────────────────────────────────────────
  // [16] 접근성 속성
  // ────────────────────────────────────────────────────────
  log('\n📋', '[16] 접근성 속성');

  // SearchBar label
  assert(await page.$('label[for="search-input"]') !== null, 'SearchBar sr-only label 존재');

  // NoteModal close button size
  await page.click('button:has-text("문장 추가")');
  await page.waitForSelector('[role="dialog"]');

  const closeBtn = page.locator('button[aria-label="모달 닫기"]');
  assert(await closeBtn.isVisible(), '모달 닫기 aria-label 존재');
  const closeBbox = await closeBtn.boundingBox();
  assert(
    closeBbox.width >= 44 && closeBbox.height >= 44,
    `닫기 버튼 44×44px: 실제 ${Math.round(closeBbox.width)}×${Math.round(closeBbox.height)}px`
  );
  await page.keyboard.press('Escape');
  await page.waitForSelector('[role="dialog"]', { state: 'detached' });

  // ────────────────────────────────────────────────────────
  // [17] JS 오류
  // ────────────────────────────────────────────────────────
  log('\n📋', '[17] 런타임 JS 오류');
  assert(jsErrors.length === 0, `JS 오류 없음 (${jsErrors.length}개)`);
  if (jsErrors.length > 0) jsErrors.forEach(e => log('   ', `  ⚠ ${e}`));

  // ────────────────────────────────────────────────────────
  // 결과 요약
  // ────────────────────────────────────────────────────────
  const total = passed + failed;
  log('\n', '─'.repeat(55));
  log('📊', `테스트 결과: ${passed}/${total} 통과`);
  if (failed > 0) {
    log('❌', `실패 항목 (${failed}개):`);
    results.filter(r => r.status === 'FAIL').forEach(r =>
      log('   ', `  - ${r.name}${r.detail ? ': ' + r.detail : ''}`)
    );
  } else {
    log('🎉', '모든 테스트 통과!');
  }
  log('', '─'.repeat(55));
  log('📸', '스크린샷: test_01~test_13.png 저장됨');

  await browser.close();
  process.exit(failed > 0 ? 1 : 0);
})();
