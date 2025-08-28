import { test, expect } from "@playwright/test";

const detailPath = (q: string = "") => `/analysis/10667/v2${q}`;

test("데이터셋 전환 + 탭 전환 스모크", async ({ page }) => {
  await page.goto(
    detailPath(
      "?ds=sale&view=integrated&p=1&s=20&lat=37.5665&lng=126.978&radius_km=2"
    )
  );
  await expect(page.getByRole("tab", { name: "통합" })).toBeVisible();
  const tabs = page.locator('div[role="tablist"]').first();
  await tabs.scrollIntoViewIfNeeded();
  // 매물 탭으로 전환
  const listingsTab = page.getByRole("tab", { name: "매물" });
  await listingsTab.scrollIntoViewIfNeeded();
  await listingsTab.click();
  await expect(page.getByText("검색 결과")).toBeVisible();
  // 목록 탭 전환
  const listTab = page.getByRole("tab", { name: "목록" });
  await listTab.scrollIntoViewIfNeeded();
  await listTab.click();
  await expect(page.getByRole("table")).toBeVisible();
  // 지도 탭 전환
  const mapTab = page.getByRole("tab", { name: "지도" });
  await mapTab.scrollIntoViewIfNeeded();
  await mapTab.click();
  await expect(page.getByText("항목")).toBeVisible();
});

test("정렬 + 페이지네이션 + URL 동기화", async ({ page }) => {
  await page.goto(
    detailPath(
      "?ds=sale&view=list&p=1&s=20&lat=37.5665&lng=126.978&radius_km=2"
    )
  );
  // 목록 탭 활성
  await expect(page.getByRole("tab", { name: "목록" })).toBeVisible();
  // 페이지 사이즈 변경 → 50
  await page.getByRole("combobox").first().click();
  await page.getByRole("option", { name: "50" }).click();
  await expect(page).toHaveURL(/s=50/);
  // 다음 페이지 이동
  const pagination = page.locator('nav[aria-label="pagination"]');
  await pagination.scrollIntoViewIfNeeded();
  await page.getByRole("link", { name: "Go to next page" }).first().click();
  await expect(page).toHaveURL(/p=2/);
});

test("지도 이동(zoom/bounds) → 요청 유효성 스모크", async ({ page }) => {
  await page.goto(
    detailPath(
      "?ds=listings&view=map&p=1&s=20&lat=37.5665&lng=126.978&radius_km=2"
    )
  );
  // 지도 탭
  await expect(page.getByRole("tab", { name: "지도" })).toBeVisible();
  // 간단 줌 버튼 사용(우하단)
  await page.getByRole("button", { name: "Zoom In" }).click();
  await page.getByRole("button", { name: "Zoom Out" }).click();
  // 항목 개수 텍스트 존재 확인
  await expect(page.getByText(/항목 \d+개/)).toBeVisible();
});
