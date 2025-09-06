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
}

// 생성된 엘리먼트는 카카오 CustomOverlay의 content로 그대로 사용 가능합니다.
export function renderBasePopup({
  title,
  subtitle,
  rows,
  widthPx = 270,
  actions,
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

  const table = document.createElement("table");
  table.style.width = "100%";
  table.style.fontSize = "12px";
  table.style.color = "#111827";
  table.style.borderCollapse = "collapse";
  table.style.tableLayout = "fixed";
  for (const r of rows) {
    const tr = document.createElement("tr");
    const tdLabel = document.createElement("td");
    tdLabel.style.padding = "2px 0";
    tdLabel.style.color = "#6b7280";
    tdLabel.textContent = r.label;
    const tdValue = document.createElement("td");
    tdValue.style.padding = "2px 0";
    tdValue.style.textAlign = "right";
    if (r.ariaLabel) tdValue.setAttribute("aria-label", r.ariaLabel);
    tdValue.textContent = r.value ?? "";
    tr.appendChild(tdLabel);
    tr.appendChild(tdValue);
    table.appendChild(tr);
  }
  root.appendChild(table);

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
