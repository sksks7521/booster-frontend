import os
import shutil
import json
import time
import requests
import numpy as np
import pandas as pd
import folium
from folium import Element
from tqdm import tqdm
import errno
import stat
from pathlib import Path

# 프로젝트의 모든 설정을 담고 있는 settings 모듈을 불러옵니다.
from config import settings
# 이전에 만든 모듈들을 불러옵니다.
from src.utils import api_clients
from src.output import writer
from src.utils.logger import setup_logger
# 안전한 공통 모듈들만 import
from .visualization_base import VisualizationBase
from .assets_manager import AssetsManager

# visualizer 모듈 전용 로거 설정
log = setup_logger()

# 공통 클래스 인스턴스들
base = VisualizationBase()
assets_manager = AssetsManager()


# 기존 함수들을 base 클래스 메서드로 대체
def _remove_readonly(func, path, exc_info):
    """rmtree() onerror 콜백"""
    return base.remove_readonly(func, path, exc_info)

def _safe_int(v):
    """안전한 정수 변환 (기존 코드와 동일하게 None -> 0 변환)"""
    result = base.safe_int(v)
    return 0 if result is None else result

def _safe_float(v):
    """안전한 실수 변환 (기존 코드와 동일하게 None -> 0.0 변환)"""
    result = base.safe_float(v)
    return 0.0 if result is None else result

def _safe_str(v):
    """안전한 문자열 변환 (기존 코드와 동일하게 None -> "" 변환)"""
    result = base.safe_str(v)
    return "" if result is None else result

def _safe_json_convert(obj):
    """JSON 직렬화를 위한 안전한 변환 (기존 코드와 완전 동일)"""
    if isinstance(obj, (np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.float64, np.float32)):
        return float(obj)
    elif pd.isna(obj):
        return None
    return obj


# CSS/JS 내용은 assets_manager에서 관리
CUSTOM_CSS_NAME = "custom.css"
CUSTOM_JS_NAME = "custom.js"


def ensure_common_assets(dest_dir: str):
    """dest_dir 에 custom.css, custom.js 작성"""
    # CSS는 공통 모듈 사용
    assets_manager.ensure_common_css(dest_dir)
    
    # JS는 경매 진행중 전용 내용으로 생성
    custom_js_content = r"""
document.addEventListener("DOMContentLoaded", function() {
    var mapName = Object.keys(window).find(k => k.startsWith('map_'));
    var myMap = window[mapName];
    L.control.zoom({ position: 'bottomright' }).addTo(myMap);

    var markerLayer = L.layerGroup().addTo(myMap);
    var markerData = window.markerData;

    // Filter 패널 토글
    var toggleBtn = document.getElementById('toggle-filter');
    var filterControls = document.getElementById('filter-controls');
    toggleBtn.addEventListener('click', function() {
        filterControls.style.display = (filterControls.style.display === 'none') ? 'block' : 'none';
    });

    // 중앙 십자
    var centerCross = document.createElement('div');
    centerCross.id = 'center-cross';
    centerCross.innerHTML = '+';
    centerCross.style.cssText = 'position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);z-index:9997;pointer-events:none;font-size:48px;color:rgba(0,0,0,0.5);';
    myMap.getContainer().appendChild(centerCross);

    // 좌측 하단 좌표 업데이트
    var centerCoordsEl = document.getElementById("center-coords");
    function updateCenterCoords() {
        var c = myMap.getCenter();
        var z = myMap.getZoom();
        centerCoordsEl.innerHTML = "X: " + c.lng.toFixed(5) + " Y: " + c.lat.toFixed(5) + " Zoom: " + z;
    }
    myMap.on('moveend', updateCenterCoords);
    updateCenterCoords();

    // Move Map 버튼
    document.getElementById('move-map-btn').addEventListener('click', function() {
        var lngVal = parseFloat(document.getElementById("target-lng").value);
        var latVal = parseFloat(document.getElementById("target-lat").value);
        if (!isNaN(lngVal) && !isNaN(latVal)) {
            myMap.setView([latVal, lngVal], myMap.getZoom());
        } else {
            alert("유효한 좌표를 입력하세요.");
        }
    });

    // 범례 업데이트 함수
    function updateLegend(thresholds) {
        var legendEl = document.getElementById("legend-container");
        legendEl.innerHTML = 
          "<b>최저가(만원) 범례</b><br>" +
          "<i style='background: blue; width:12px; height:12px; display:inline-block;'></i> &le; " + thresholds[0] + "<br>" +
          "<i style='background: green; width:12px; height:12px; display:inline-block;'></i> &le; " + thresholds[1] + "<br>" +
          "<i style='background: pink; width:12px; height:12px; display:inline-block;'></i> &le; " + thresholds[2] + "<br>" +
          "<i style='background: orange; width:12px; height:12px; display:inline-block;'></i> &le; " + thresholds[3] + "<br>" +
          "<i style='background: red; width:12px; height:12px; display:inline-block;'></i> > " + thresholds[3] + 
          "<hr style='margin:3px 0;'>" +
          "<b>네모박스 숫자</b><br>" +
          "예) <strong>40</strong> → 최저가/감정가 40~49%";
    }

    // 색상, 아이콘 텍스트 반환 함수
    function getColorByPrice(price, thresholds) {
        if (price == null || price === 0) return 'grey';
        if (price <= thresholds[0]) return 'blue';
        else if (price <= thresholds[1]) return 'green';
        else if (price <= thresholds[2]) return 'pink';
        else if (price <= thresholds[3]) return 'orange';
        else return 'red';
    }

    function getIconTextByPercentage(p) {
        if (p == null) return '--';
        if (p < 10) return '00';
        else if (p < 20) return '10';
        else if (p < 30) return '20';
        else if (p < 40) return '30';
        else if (p < 50) return '40';
        else if (p < 60) return '50';
        else if (p < 70) return '60';
        else if (p < 80) return '70';
        else if (p < 90) return '80';
        else if (p < 100) return '90';
        else return '100';
    }

    // 팝업 내용 생성
    function createPopupContent(item) {
        function safeDisplay(val) {
            return (val === null || val === "null") ? "" : val;
        }
        return `
        <table style="width:100%; border-collapse:collapse;">
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">용도</th>
            <td style="border:1px solid black;">${safeDisplay(item.용도)}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">사건</th>
            <td style="border:1px solid black;">${safeDisplay(item.사건)}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">소재지</th>
            <td style="border:1px solid black;">${safeDisplay(item.소재지)}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">건물평형</th>
            <td style="border:1px solid black;">${safeDisplay(item.건물평형)}평</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">감정가<br>(만원)</th>
            <td style="border:1px solid black;">${safeDisplay(item["감정가(만원)"])}만원</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">최저가<br>(만원)</th>
            <td style="border:1px solid black;">${safeDisplay(item["최저가(만원)"])}만원</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">최저가/감정가</th>
            <td style="border:1px solid black;">${safeDisplay(item.percentage)}%</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">현재상태</th>
            <td style="border:1px solid black;">${safeDisplay(item.현재상태)}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">매각기일</th>
            <td style="border:1px solid black;">${safeDisplay(item.매각기일)}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">공시가격</th>
            <td style="border:1px solid black;">${safeDisplay(item.공시가격)}만원</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">Elevator<br>여부</th>
            <td style="border:1px solid black;">${safeDisplay(item["Elevator여부"])}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">층확인</th>
            <td style="border:1px solid black;">${safeDisplay(item["층확인"])}</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">건축연도</th>
            <td style="border:1px solid black;">${item.건축연도 ? Math.floor(item.건축연도) : ''}년</td>
          </tr>
          <tr>
            <th style="border:1px solid black;background:#f2f2f2;">최저가/공시지가</th>
            <td style="border:1px solid black;">${safeDisplay(item["최저가/공시가격"])}</td>
          </tr>
        </table>`;
    }

    function addMarkers(filteredData, thresholds) {
        markerLayer.clearLayers();
        filteredData.forEach(function(item) {
            var color = getColorByPrice(item["최저가(만원)"], thresholds);
            var iconText = getIconTextByPercentage(item.percentage);
            var icon = L.divIcon({
                html: `<div style="background-color:${color};color:white;border-radius:4px;padding:4px;text-align:center;width:25px;height:25px;line-height:25px;">${iconText}</div>`,
                className: '',
                iconSize: [25, 25]
            });
            L.marker([item.latitude, item.longitude], {icon: icon})
             .bindPopup(createPopupContent(item))
             .addTo(markerLayer);
        });
    }

    function applyFilters() {
        // Threshold 값
        var t1 = parseFloat(document.getElementById('threshold_1').value) || 0;
        var t2 = parseFloat(document.getElementById('threshold_2').value) || 0;
        var t3 = parseFloat(document.getElementById('threshold_3').value) || 0;
        var t4 = parseFloat(document.getElementById('threshold_4').value) || 0;
        var thresholds = [t1, t2, t3, t4];

        // 필터 값들 수집
        var selected주소시군구 = Array.from(document.querySelectorAll('.filter-주소시군구:checked')).map(el => el.value);
        var selected주소구역 = Array.from(document.querySelectorAll('.filter-주소구역:checked')).map(el => el.value);
        var selectedUsage = Array.from(document.querySelectorAll('.filter-usage:checked')).map(el => el.value);
        var selected매각기일 = Array.from(document.querySelectorAll('.filter-매각기일:checked')).map(el => el.value);
        var selected현재상태 = Array.from(document.querySelectorAll('.filter-현재상태:checked')).map(el => el.value);
        var selected건물평형범위 = Array.from(document.querySelectorAll('.filter-건물평형범위:checked')).map(el => el.value);
        var selected1억이하 = Array.from(document.querySelectorAll('.filter-1억이하:checked')).map(el => el.value);
        var selected_층확인 = Array.from(document.querySelectorAll('.filter-층확인:checked')).map(el => el.value);
        var selected_Elevator여부 = Array.from(document.querySelectorAll('.filter-Elevator여부:checked')).map(el => el.value);
        var selected_읍면동 = Array.from(document.querySelectorAll('.filter-읍면동:checked')).map(el => el.value);
        var selected_매각월 = Array.from(document.querySelectorAll('.filter-매각월:checked')).map(el => el.value);

        updateLegend(thresholds);

        var filteredData = markerData.filter(function(item) {
            if (selected주소시군구.indexOf(item["주소(시군구)"]) === -1) return false;
            if (selected주소구역.indexOf(item["주소(구역)"]) === -1) return false;
            if (selectedUsage.indexOf(item.용도) === -1) return false;
            if (selected매각기일.indexOf(item.매각기일) === -1) return false;
            if (selected현재상태.indexOf(item.현재상태) === -1) return false;
            if (selected건물평형범위.indexOf(item["건물평형(범위)"]) === -1) return false;
            if (selected1억이하.indexOf(item["1억 이하 여부"]) === -1) return false;
            if (selected_층확인.indexOf(item["층확인"]) === -1) return false;
            if (selected_Elevator여부.indexOf(item["Elevator여부"]) === -1) return false;
            if (selected_읍면동.indexOf(item["읍면동"]) === -1) return false;
            if (selected_매각월.indexOf(item["매각월"]) === -1) return false;
            return true;
        });

        addMarkers(filteredData, thresholds);
    }

    // 이벤트 등록
    var allInputs = document.querySelectorAll('#filter-controls input, #filter-controls select, #threshold-box input');
    allInputs.forEach(function(inp){
        inp.addEventListener('change', applyFilters);
        inp.addEventListener('input', applyFilters);
    });

    // Threshold 변경
    var thresholdInputs = document.querySelectorAll('#threshold-box input[type="number"]');
    var t1_init = 6000, t2_init = 8000, t3_init = 10000, t4_init = 13000;
    var prevThresholds = [t1_init, t2_init, t3_init, t4_init];
    
    thresholdInputs.forEach(function(input, index) {
        input.addEventListener('change', function() {
            var newValue = parseFloat(input.value);
            if (isNaN(newValue)) newValue = 0;
            var newThresholds = prevThresholds.slice();
            newThresholds[index] = newValue;
            if (newThresholds[0] > newThresholds[1] ||
                newThresholds[1] > newThresholds[2] ||
                newThresholds[2] > newThresholds[3]) {
                alert("Threshold 순서가 올바르지 않습니다 (t1 ≤ t2 ≤ t3 ≤ t4)");
                input.value = prevThresholds[index];
            } else {
                prevThresholds = newThresholds;
                applyFilters();
            }
        });
    });
    
    // 초기화 버튼
    document.getElementById('reset-filters').addEventListener('click', function() {
        document.querySelectorAll('#filter-controls input[type="checkbox"]').forEach(function(checkbox) {
            checkbox.checked = true;
        });
        document.getElementById('threshold_1').value = t1_init;
        document.getElementById('threshold_2').value = t2_init;
        document.getElementById('threshold_3').value = t3_init;
        document.getElementById('threshold_4').value = t4_init;
        prevThresholds = [t1_init, t2_init, t3_init, t4_init];
        applyFilters();
    });

    // "모두 선택" 버튼 이벤트
    document.querySelectorAll('.toggle-all').forEach(function(button) {
        button.addEventListener('click', function() {
            var groupDiv = this.closest('.checkbox-group');
            var checkboxes = groupDiv.querySelectorAll('input[type="checkbox"]');
            var allChecked = Array.from(checkboxes).every(cb => cb.checked);
            checkboxes.forEach(cb => { cb.checked = !allChecked; });
            this.textContent = (!allChecked) ? "모두 해제" : "모두 선택";
            applyFilters();
        });
    });

    // 초기 표시
    updateLegend(prevThresholds);
    addMarkers(markerData, [6000, 8000, 10000, 13000]);
});
"""
    
    # custom.js 파일 생성
    js_path = os.path.join(dest_dir, CUSTOM_JS_NAME)
    with open(js_path, "w", encoding="utf-8") as f:
        f.write(custom_js_content)
    
    log.info(f"경매 진행중 전용 JS 파일 생성: {js_path}")


def build_map_html(df: pd.DataFrame, out_dir: str) -> None:
    """
    folium 기반 지도 HTML을 out_dir에 저장
    (기존 방식 복원 - 고유 로직 유지)
    """
    # 기존 방식과 동일한 지도 생성 로직 유지
    # 이 부분은 각 visualizer의 고유 특성을 가지므로 그대로 유지
    import folium
    from folium import Element
    import os

    os.makedirs(out_dir, exist_ok=True)

    # ────────── 0) 숨김 체크박스용 특수권리 목록 (원본과 동일) ──────────
    SPECIAL_RIGHTS = [
        '대항력있는임차인','HUG인수조건변경','선순위임차권','재매각','지분매각','공동담보',
        '별도등기','유치권','위반건축물','전세권매각','대지권미등기'
    ]

    # ────────── 1) 지도 기본(중심) ──────────
    if not df["latitude"].dropna().empty and not df["longitude"].dropna().empty:
        c_lat = df["latitude"].dropna().mean()
        c_lng = df["longitude"].dropna().mean()
    else:  # 좌표 전부 결측 시 → 서울시청
        c_lat, c_lng = 37.5665, 126.9780

    # VWorld API 키를 환경변수에서 가져옴
    VWORLD_API_KEY = os.getenv('VWORLD_API_KEY')
    
    if VWORLD_API_KEY:
        tiles_url = f'http://api.vworld.kr/req/wmts/1.0.0/{VWORLD_API_KEY}/Base/{{z}}/{{y}}/{{x}}.png'
        m = folium.Map(
            location=[c_lat, c_lng],
            zoom_start=11,
            zoom_control=False,
            tiles=tiles_url,
            attr='VWorld'
        )
    else:
        # VWorld 키가 없으면 기본 타일 사용
        m = folium.Map(
            location=[c_lat, c_lng],
            zoom_start=11,
            zoom_control=False
        )

    # ────────── 2) 필터 패널 HTML ──────────
    uniq = lambda col: sorted(df[col].dropna().unique().tolist())

    def _checkbox_list(col, cls):
        return ''.join(
            f'<label><input type="checkbox" class="{cls}" value="{v}" checked> {v}</label>'
            for v in uniq(col)
        )

    # (i) 일반 필터 UI
    html_controls = f"""
    <div id="filter-button"><button id="toggle-filter">Filter</button></div>

    <div id="filter-controls" style="display:none;">

      <details>
        <summary><strong>주소(구역)</strong></summary>
        <div class="checkbox-group" data-filter="filter-주소구역">
          {_checkbox_list('주소(구역)', 'filter-주소구역')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>주소(시군구)</strong></summary>
        <div class="checkbox-group" data-filter="filter-주소시군구">
          {_checkbox_list('주소(시군구)', 'filter-주소시군구')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>읍면동</strong></summary>
        <div class="checkbox-group" data-filter="filter-읍면동">
          {_checkbox_list('읍면동', 'filter-읍면동')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>용도</strong></summary>
        <div class="checkbox-group" data-filter="filter-usage">
          {_checkbox_list('용도', 'filter-usage')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>매각기일</strong></summary>
        <div class="checkbox-group" data-filter="filter-매각기일">
          {_checkbox_list('매각기일', 'filter-매각기일')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>매각_월</strong></summary>
        <div class="checkbox-group" data-filter="filter-매각월">
          {_checkbox_list('매각_월', 'filter-매각월')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>현재상태</strong></summary>
        <div class="checkbox-group" data-filter="filter-현재상태">
          {_checkbox_list('현재상태', 'filter-현재상태')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>건물평형(범위)</strong></summary>
        <div class="checkbox-group" data-filter="filter-건물평형범위">
          {_checkbox_list('건물평형(범위)', 'filter-건물평형범위')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>1억 이하 여부</strong></summary>
        <div class="checkbox-group" data-filter="filter-1억이하">
          {_checkbox_list('1억 이하 여부', 'filter-1억이하')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>층확인</strong></summary>
        <div class="checkbox-group" data-filter="filter-층확인">
          {_checkbox_list('층확인', 'filter-층확인')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <details>
        <summary><strong>Elevator 여부</strong></summary>
        <div class="checkbox-group" data-filter="filter-Elevator여부">
          {_checkbox_list('Elevator여부', 'filter-Elevator여부')}
          <button type="button" class="toggle-all">모두 선택</button>
        </div>
      </details>

      <div style="text-align:center;margin-top:10px;">
        <button id="reset-filters">초기화</button>
      </div>
    </div>
    """

    # (ii) 특수권리용 "숨김" 체크박스 자동 삽입 (원본과 동일)
    for sr in SPECIAL_RIGHTS:
        html_controls += f"""
    <div style="display:none">
      <input type="checkbox" class="filter-{sr}" value="True"  checked>
      <input type="checkbox" class="filter-{sr}" value="False" checked>
    </div>
    """

    # (iii) 나머지 상시 UI
    html_controls += """
    <div id="legend-container" class="legend"></div>

    <div id="threshold-box" class="threshold-box">
      <label>Threshold&nbsp;1: <input type="number" id="threshold_1" value="6000"  step="1000"></label>
      <label>Threshold&nbsp;2: <input type="number" id="threshold_2" value="8000"  step="1000"></label>
      <label>Threshold&nbsp;3: <input type="number" id="threshold_3" value="10000" step="1000"></label>
      <label>Threshold&nbsp;4: <input type="number" id="threshold_4" value="13000" step="1000"></label>
    </div>

    <div id="center-coords" class="center-coords"></div>

    <div id="move-map" class="move-map">
      <label>X: <input type="number" id="target-lng" placeholder="경도" step="0.0001"></label>
      <label>Y: <input type="number" id="target-lat" placeholder="위도" step="0.0001"></label>
      <button id="move-map-btn">Go</button>
    </div>
    """

    m.get_root().html.add_child(Element(html_controls))

    # ────────── 3) css / js 연결 ──────────
    m.get_root().header.add_child(Element('<link rel="stylesheet" href="custom.css">'))
    m.get_root().html.add_child(Element('<script src="marker_data.js"></script>'))
    m.get_root().html.add_child(Element('<script src="custom.js"></script>'))

    # ────────── 4) 저장 ──────────
    m.save(os.path.join(out_dir, "Auction_ing_Result_Map.html"))


def save_marker_data_js(df: pd.DataFrame, file_path: str):
    """
    경매 진행중 전용 마커 데이터를 JavaScript 파일로 저장
    """
    marker_data = []
    
    for _, row in df.iterrows():
        # 좌표가 없으면 건너뜀
        if pd.isna(row.get('latitude')) or pd.isna(row.get('longitude')):
            continue
        
        # 경매 진행중 고유 데이터 구조
        item = {
            'latitude': _safe_float(row.get('latitude')),
            'longitude': _safe_float(row.get('longitude')),
            '감정가(만원)': _safe_float(row.get('감정가(만원)')),
            '최저가(만원)': _safe_float(row.get('최저가(만원)')),
            'percentage': _safe_float(row.get('최저가/감정가(%)')),  # 경매 진행중 고유
            '용도': _safe_str(row.get('용도')),
            '사건': _safe_str(row.get('사건')),
            '소재지': _safe_str(row.get('소재지')),
            '건물평형': _safe_str(row.get('건물평형')),
            '현재상태': _safe_str(row.get('현재상태')),
            '매각기일': _safe_str(row.get('매각기일')),
            '공시가격': _safe_float(row.get('공시가격(만원)')),  # 경매 진행중 고유
            'Elevator여부': _safe_str(row.get('Elevator여부')),
            '층확인': _safe_str(row.get('층확인')),
            '건축연도': _safe_int(row.get('건축연도')),
            '최저가/공시가격': _safe_float(row.get('최저가/공시가격')),  # 경매 진행중 고유
            '주소(시군구)': _safe_str(row.get('주소(시군구)')),
            '주소(구역)': _safe_str(row.get('주소(구역)')),
            '건물평형(범위)': _safe_str(row.get('건물평형(범위)')),
            '1억 이하 여부': _safe_str(row.get('1억 이하 여부')),  # 경매 진행중 고유
            '읍면동': _safe_str(row.get('읍면동')),
            '매각월': _safe_str(row.get('매각_월'))
        }
        
        marker_data.append(item)

    try:
        with open(file_path, "w", encoding="utf-8") as f:
            f.write("window.markerData = " + json.dumps(marker_data, ensure_ascii=False, indent=2) + ";")
        log.info(f"경매 진행중 마커 데이터 JS 파일 생성 완료: {file_path} ({len(marker_data)}건)")
    except Exception as e:
        log.error(f"마커 데이터 JS 파일 생성 실패: {file_path} - {e}")

def save_region_outputs(df_region: pd.DataFrame, out_dir: str):
    """지역별 결과물 저장"""
    os.makedirs(out_dir, exist_ok=True)
    ensure_common_assets(out_dir)

    # marker_data.js 생성 (경매 진행중 고유 구조)
    save_marker_data_js(df_region, os.path.join(out_dir, "marker_data.js"))

    # DataTables CSV (원본과 동일한 컬럼 구성)
    selected_columns = [
        '용도', '사건년도', '사건', '현재상태', '매각기일', '매각_월', '주소(구역)', '주소(시군구)', '행정동명칭', '소재지',
        '도로명주소', '지번주소', '우편번호', 'PNU', '층수', '토지평형', '건물평형', '건물평형(범위)',
        '감정가(만원)', '최저가(만원)', '최저가/감정가(%)', '공시가격(만원)', '최저가/공시가격', '1억 이하 여부',
        '특수권리', '대항력있는임차인', 'HUG인수조건변경', '선순위임차권', '재매각', '지분매각', '공동담보',
        '별도등기', '유치권', '위반건축물', '전세권매각', '대지권미등기', 
        '건물명', '동명', '대지면적(㎡)', '건축면적(㎡)', '연면적(㎡)', '건폐율(%)', '용적률(%)', 
        '주구조', '주용도', '기타용도', '높이', '지상층수', '지하층수', '세대수', '가구수', '호수',
        '사용승인일', '승용승강기(대)', '건축연도', '층확인', 'Elevator여부'
    ]
    
    # 없는 컬럼은 빈 문자열로
    for c in selected_columns:
        if c not in df_region.columns:
            df_region[c] = ""
            
    auction_selected = df_region[selected_columns].copy()

    # 접두사 변경 (원본 로직과 동일)
    building_info_start_col = '건물명'
    start_idx = selected_columns.index(building_info_start_col)
    building_info_columns = selected_columns[start_idx:]
    special_right_columns = [
        '대항력있는임차인', 'HUG인수조건변경', '선순위임차권', '재매각', '지분매각', '공동담보',
        '별도등기', '유치권', '위반건축물', '전세권매각', '대지권미등기'
    ]
    renamed_columns = {col: f'(건물정보){col}' for col in building_info_columns}
    renamed_columns.update({col: f'(특수권리){col}' for col in special_right_columns})
    auction_selected.rename(columns=renamed_columns, inplace=True)
    
    csv_path = os.path.join(out_dir, "Auction_ing_Result_Final_datatables.csv")
    auction_selected.to_csv(csv_path, index=False, encoding="utf-8-sig")
    log.info(f"[CSV] {csv_path}  (rows={len(auction_selected)})")
    
    build_map_html(df_region, out_dir)


def process_and_split(csv_total: str, base_out_dir: str):
    """
    좌표 보강 및 지역별 파일 생성 (원본 코드 기능)
    """
    if not os.path.exists(csv_total):
        raise FileNotFoundError(csv_total)

    df = pd.read_csv(csv_total, encoding="utf-8-sig")

    # 좌표 컬럼 확보
    if "longitude" not in df.columns:
        df["longitude"] = df.get("x좌표(경도)", np.nan)
    if "latitude" not in df.columns:
        df["latitude"] = df.get("y좌표(위도)", np.nan)

    # Kakao 지오코딩으로 누락 좌표 보강
    need_geo = df[pd.isna(df["latitude"]) | pd.isna(df["longitude"])]
    if not need_geo.empty:
        log.info(f"\n[좌표 변환] 총 {len(need_geo)}건 필요")
        
        k1_expired = k2_expired = False
        success_count = 0
        fail_count = 0
        
        for idx, row in tqdm(need_geo.iterrows(),
                             total=len(need_geo),
                             desc="🗺️  Kakao 좌표 변환",
                             unit="건",
                             ncols=80,
                             mininterval=10.0,
                             maxinterval=10.0):
            addr = str(row.get("도로명주소", "")).strip()
            if not addr:
                continue

            lat, lng, k1_expired, k2_expired = api_clients.get_lat_lng_only_kakao(
                addr, k1_expired, k2_expired
            )
            
            if lat is not None:
                df.at[idx, "latitude"] = lat
                df.at[idx, "longitude"] = lng
                success_count += 1
            else:
                fail_count += 1

            # 두 키 모두 소진되면 즉시 중단
            if k1_expired and k2_expired:
                log.info(f"\n[WARN] 두 API 키 모두 만료 - 좌표 변환 중단")
                log.info(f"       성공: {success_count}건, 실패: {fail_count}건")
                break

            time.sleep(0.05)   # API 호출 간격

        log.info(f"\n[좌표 변환 완료] 성공: {success_count}건, 실패: {fail_count}건")
        
        # 보강된 좌표를 원본 CSV에 저장
        df.to_csv(csv_total, index=False, encoding="utf-8-sig")

    # 지역별 파일 세트 생성
    for prov in df["주소(구역)"].dropna().unique():
        df_prov = df[df["주소(구역)"] == prov].copy()
        prov_dir = os.path.join(base_out_dir, prov.strip())
        save_region_outputs(df_prov, prov_dir)

        # 시·군·구 단위 세트
        for city in df_prov["주소(시군구)"].dropna().unique():
            df_city = df_prov[df_prov["주소(시군구)"] == city].copy()
            city_dir = os.path.join(prov_dir, city.strip())
            save_region_outputs(df_city, city_dir)

    # 전국 세트
    save_region_outputs(df, base_out_dir)


def run_visualization_generation(total_csv_path: str, settings_obj: object, target_date: str = None):
    """
    시각화 결과물 생성의 메인 실행 함수입니다.
    좌표 보강부터 지역별 결과물 생성까지 모든 과정을 포함합니다.
    """
    log.info(">> 3. 시각화 결과물 생성을 시작합니다...")
    
    from config.settings import ensure_dated_folder, get_today_date_str
    
    if target_date is None:
        target_date = get_today_date_str()
    
    # 날짜별 시각화 결과 폴더 생성 (예: 3.final_data/Data_20250724/)
    dated_base_dir = ensure_dated_folder(settings_obj.FINAL_DATA_PATH / "Data", target_date)
    base_out_dir = str(dated_base_dir)
    
    log.info(f"시각화 결과 저장 경로: {base_out_dir}")
    
    # 기존 출력 폴더 초기화
    if os.path.exists(base_out_dir):
        shutil.rmtree(base_out_dir, onerror=_remove_readonly)
    os.makedirs(base_out_dir, exist_ok=True)
    
    try:
        process_and_split(total_csv_path, base_out_dir)
        log.info("✅ 시각화 결과물 생성이 완료되었습니다.")
    except Exception as e:
        log.error(f"❌ 시각화 결과물 생성 중 오류 발생: {e}")
        raise