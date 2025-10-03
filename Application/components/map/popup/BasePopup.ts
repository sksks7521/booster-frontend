"use client";

export interface PopupRow {
  label: string;
  value: string;
  ariaLabel?: string;
}

export interface BasePopupOptions {
  title?: string;
  subtitle?: string; // 소재지 등 1줄 설명
  rows: PopupRow[];
  widthPx?: number; // default 270
  actions?: { label: string; action: string }[]; // 예: 주소복사/사건번호복사
  table?: {
    headers: string[];
    rows: any[][];
  }; // 🆕 개별 거래 테이블 (실거래가 전용)
  tableCollapsible?: boolean; // 🆕 테이블 접기/펴기 가능 여부 (기본값: true)
}

// 생성된 엘리먼트는 카카오 CustomOverlay의 content로 그대로 사용 가능합니다.
export function renderBasePopup({
  title,
  subtitle,
  rows,
  widthPx = 270,
  actions,
  table,
  tableCollapsible = true,
}: BasePopupOptions): HTMLElement {
  const root = document.createElement("div");
  root.style.width = `${widthPx}px`;
  root.style.maxWidth = `${widthPx}px`;
  root.style.background = "rgba(255,255,255,0.98)";
  root.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
  root.style.border = "1px solid rgba(0,0,0,0.08)";
  root.style.borderRadius = "8px";
  root.style.padding = "10px";
  root.style.position = "relative";

  const topBar = document.createElement("div");
  topBar.style.display = "flex";
  topBar.style.gap = "6px";
  topBar.style.justifyContent = "flex-end";
  topBar.style.marginBottom = "4px";

  const favBtn = document.createElement("button");
  favBtn.title = "관심물건";
  favBtn.setAttribute("data-action", "fav");
  favBtn.setAttribute("data-active", "0");
  Object.assign(favBtn.style, baseIconBtnStyle());
  favBtn.textContent = "☆";
  const shareBtn = document.createElement("button");
  shareBtn.title = "공유";
  shareBtn.setAttribute("data-action", "share");
  Object.assign(shareBtn.style, baseIconBtnStyle());
  shareBtn.textContent = "🔗";
  topBar.appendChild(favBtn);
  topBar.appendChild(shareBtn);
  root.appendChild(topBar);

  if (title) {
    const titleEl = document.createElement("div");
    titleEl.style.fontWeight = "600";
    titleEl.style.fontSize = "13px";
    titleEl.style.marginBottom = "6px";
    titleEl.style.whiteSpace = "nowrap";
    titleEl.style.overflow = "hidden";
    titleEl.style.textOverflow = "ellipsis";
    titleEl.textContent = title;
    root.appendChild(titleEl);
  }

  if (subtitle) {
    const sub = document.createElement("div");
    sub.style.fontSize = "12px";
    sub.style.color = "#4b5563";
    // 긴 소재지는 줄바꿈/단어 단위로 개행하여 전체를 보이게 함
    sub.style.whiteSpace = "normal";
    sub.style.wordBreak = "break-word";
    sub.style.overflow = "visible";
    sub.style.textOverflow = "clip";
    sub.style.marginBottom = "6px";
    sub.textContent = subtitle;
    root.appendChild(sub);
  }

  if (actions && actions.length > 0) {
    const row = document.createElement("div");
    row.style.display = "flex";
    row.style.gap = "6px";
    row.style.justifyContent = "flex-start";
    row.style.margin = "6px 0 8px 0";
    for (const a of actions) {
      const b = document.createElement("button");
      b.setAttribute("data-action", a.action);
      Object.assign(b.style, pillButtonStyle("#e5e7eb", "#111827", "#fff"));
      b.style.padding = "4px 8px";
      b.style.fontSize = "11px";
      b.textContent = a.label;
      row.appendChild(b);
    }
    root.appendChild(row);
  }

  const infoTable = document.createElement("table");
  infoTable.style.width = "100%";
  infoTable.style.fontSize = "12px";
  infoTable.style.color = "#111827";
  infoTable.style.borderCollapse = "collapse";
  infoTable.style.tableLayout = "fixed";
  for (const r of rows) {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    tdLabel.style.padding = "2px 0";
    tdLabel.style.color = "#6b7280";
    tdLabel.textContent = r.label;
    const tdValue = document.createElement("td");
    tdValue.style.padding = "2px 0";
    tdValue.style.textAlign = "right";
    // 긴 값이 팝업을 넘어가지 않도록 줄바꿈/단어 단위 개행 적용
    tdValue.style.whiteSpace = "normal";
    tdValue.style.wordBreak = "break-word";
    (tdValue.style as any).overflowWrap = "anywhere";
    tdValue.style.lineHeight = "1.4";
    if (r.ariaLabel) tdValue.setAttribute("aria-label", r.ariaLabel);
    tdValue.textContent = r.value ?? "";
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    infoTable.appendChild(tr);
  }
  root.appendChild(infoTable);

  // 🆕 개별 거래 테이블 렌더링 (실거래가 전용)
  if (table && table.rows && table.rows.length > 0) {
    const transactionSection = document.createElement("div");
    transactionSection.style.marginTop = "12px";
    transactionSection.style.paddingTop = "12px";
    transactionSection.style.borderTop = "1px solid #e5e7eb";

    // 섹션 헤더 (제목 + 토글 버튼)
    const sectionHeader = document.createElement("div");
    sectionHeader.style.display = "flex";
    sectionHeader.style.justifyContent = "space-between";
    sectionHeader.style.alignItems = "center";
    sectionHeader.style.marginBottom = "8px";

    const sectionTitle = document.createElement("div");
    sectionTitle.style.fontWeight = "600";
    sectionTitle.style.fontSize = "12px";
    sectionTitle.style.color = "#111827";
    sectionTitle.textContent = `📊 개별 거래 내역 (${table.rows.length}건)`;

    sectionHeader.appendChild(sectionTitle);

    if (tableCollapsible) {
      const toggleBtn = document.createElement("button");
      toggleBtn.setAttribute("data-action", "toggle-table");
      toggleBtn.setAttribute("data-collapsed", "true");
      Object.assign(
        toggleBtn.style,
        pillButtonStyle("#e5e7eb", "#111827", "#fff")
      );
      toggleBtn.style.padding = "4px 8px";
      toggleBtn.style.fontSize = "11px";
      toggleBtn.innerHTML = "▼ 펴기";
      sectionHeader.appendChild(toggleBtn);
    }

    transactionSection.appendChild(sectionHeader);

    // 거래 테이블 컨테이너 (접기/펴기 대상)
    const tableContainer = document.createElement("div");
    tableContainer.setAttribute("data-table-container", "true");
    tableContainer.style.display = tableCollapsible ? "none" : "block";
    tableContainer.style.maxHeight = "300px";
    tableContainer.style.overflowY = "auto";
    tableContainer.style.overflowX = "auto";
    tableContainer.style.border = "1px solid #e5e7eb";
    tableContainer.style.borderRadius = "4px";

    const transactionTable = document.createElement("table");
    transactionTable.style.width = "100%";
    transactionTable.style.fontSize = "11px";
    transactionTable.style.borderCollapse = "collapse";
    transactionTable.style.minWidth = "600px"; // 가로 스크롤을 위한 최소 너비

    // 테이블 헤더
    const thead = document.createElement("thead");
    thead.style.position = "sticky";
    thead.style.top = "0";
    thead.style.background = "#f9fafb";
    thead.style.zIndex = "1";
    const headerRow = document.createElement("tr");
    for (const header of table.headers) {
      const th = document.createElement("th");
      th.style.padding = "6px 4px";
      th.style.textAlign = "left";
      th.style.fontWeight = "600";
      th.style.color = "#374151";
      th.style.borderBottom = "1px solid #e5e7eb";
      th.style.whiteSpace = "nowrap";
      th.textContent = header;
      headerRow.appendChild(th);
    }
    thead.appendChild(headerRow);
    transactionTable.appendChild(thead);

    // 테이블 바디
    const tbody = document.createElement("tbody");
    for (const row of table.rows) {
      const tr = document.createElement("tr");
      tr.style.borderBottom = "1px solid #f3f4f6";
      for (const cell of row) {
        const td = document.createElement("td");
        td.style.padding = "6px 4px";
        td.style.color = "#111827";
        td.style.whiteSpace = "nowrap";
        td.textContent = cell ?? "-";
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    transactionTable.appendChild(tbody);

    tableContainer.appendChild(transactionTable);
    transactionSection.appendChild(tableContainer);
    root.appendChild(transactionSection);

    // 토글 기능 이벤트 핸들러
    if (tableCollapsible) {
      const toggleBtn = sectionHeader.querySelector(
        '[data-action="toggle-table"]'
      ) as HTMLButtonElement;
      if (toggleBtn) {
        toggleBtn.addEventListener("click", () => {
          const isCollapsed =
            toggleBtn.getAttribute("data-collapsed") === "true";
          if (isCollapsed) {
            tableContainer.style.display = "block";
            toggleBtn.setAttribute("data-collapsed", "false");
            toggleBtn.innerHTML = "▲ 접기";
          } else {
            tableContainer.style.display = "none";
            toggleBtn.setAttribute("data-collapsed", "true");
            toggleBtn.innerHTML = "▼ 펴기";
          }
        });
      }
    }
  }

  const footer = document.createElement("div");
  footer.style.display = "flex";
  footer.style.gap = "8px";
  footer.style.marginTop = "10px";
  footer.style.justifyContent = "center";

  const closeBtn = document.createElement("button");
  closeBtn.setAttribute("data-action", "close");
  Object.assign(closeBtn.style, pillButtonStyle("#e5e7eb", "#111827", "#fff"));
  closeBtn.textContent = "닫기";
  const detailBtn = document.createElement("button");
  detailBtn.setAttribute("data-action", "detail");
  Object.assign(detailBtn.style, pillButtonStyle("#1d4ed8", "#fff", "#2563eb"));
  detailBtn.textContent = "상세보기";
  footer.appendChild(closeBtn);
  footer.appendChild(detailBtn);
  root.appendChild(footer);

  return root;
}

function baseIconBtnStyle(): Partial<CSSStyleDeclaration> {
  return {
    width: "24px",
    height: "24px",
    border: "1px solid #e5e7eb",
    borderRadius: "9999px",
    background: "#fff",
    boxShadow: "0 1px 2px rgba(0,0,0,.06)",
    fontSize: "14px",
    lineHeight: "22px",
  } as Partial<CSSStyleDeclaration>;
}

function pillButtonStyle(
  borderColor: string,
  textColor: string,
  bgColor: string
): Partial<CSSStyleDeclaration> {
  return {
    padding: "6px 12px",
    border: `1px solid ${borderColor}`,
    borderRadius: "9999px",
    background: bgColor,
    color: textColor,
    fontSize: "12px",
  } as Partial<CSSStyleDeclaration>;
}
