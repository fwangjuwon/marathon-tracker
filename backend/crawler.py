import re
import time
import json
import os
import hashlib
from datetime import datetime, date
import requests
from bs4 import BeautifulSoup

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
DATA_FILE = os.path.join(DATA_DIR, "marathons.json")

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "ko-KR,ko;q=0.9",
    "Referer": "http://marathon.pe.kr/",
}

LIST_URL = "http://www.roadrun.co.kr/schedule/list.php?today=1767193200&todays=Y"
DETAIL_BASE = "http://www.roadrun.co.kr/schedule/view.php?no="

REGION_KEYWORDS = {
    "서울": ["서울"],
    "경기": ["경기", "수원", "성남", "안양", "안산", "고양", "의정부", "파주", "구리", "하남", "광명", "평택", "시흥", "군포", "오산", "이천", "안성", "김포", "화성", "양주", "포천", "여주", "가평", "양평", "남양주", "용인", "부천", "광주"],
    "인천": ["인천"],
    "강원": ["강원", "춘천", "원주", "강릉", "동해", "태백", "속초", "삼척", "홍천", "횡성", "영월", "평창", "정선", "철원", "화천", "양구", "인제", "고성", "양양"],
    "충북": ["충북", "청주", "충주", "제천", "보은", "옥천", "영동", "증평", "진천", "괴산", "음성", "단양"],
    "충남": ["충남", "천안", "공주", "보령", "아산", "서산", "논산", "계룡", "당진", "금산", "부여", "서천", "청양", "홍성", "예산", "태안"],
    "대전": ["대전"],
    "세종": ["세종"],
    "전북": ["전북", "전주", "군산", "익산", "정읍", "남원", "김제", "완주", "무주", "진안", "장수", "임실", "순창", "고창", "부안"],
    "전남": ["전남", "목포", "여수", "순천", "나주", "광양", "담양", "곡성", "구례", "고흥", "보성", "화순", "장흥", "강진", "해남", "영암", "무안", "함평", "영광", "장성", "완도", "진도", "신안"],
    "광주": ["광주"],
    "경북": ["경북", "포항", "경주", "김천", "안동", "구미", "영주", "영천", "상주", "문경", "경산", "의성", "청송", "영양", "영덕", "청도", "고령", "성주", "칠곡", "예천", "봉화", "울진"],
    "경남": ["경남", "창원", "진주", "통영", "사천", "김해", "밀양", "거제", "양산", "의령", "함안", "창녕", "고성", "남해", "하동", "산청", "함양", "거창", "합천"],
    "대구": ["대구"],
    "부산": ["부산"],
    "울산": ["울산"],
    "제주": ["제주", "서귀포"],
}


def fetch_euckr(url: str, delay: float = 0.0) -> str | None:
    if delay:
        time.sleep(delay)
    try:
        res = requests.get(url, headers=HEADERS, timeout=12)
        if res.status_code != 200:
            return None
        return res.content.decode("euc-kr", errors="replace")
    except Exception as e:
        print(f"[크롤러] 요청 실패 {url}: {e}")
        return None


def extract_region(text: str) -> str:
    for region, keywords in REGION_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                return region
    return "기타"


def parse_korean_date(s: str) -> str:
    """
    '2026년5월2일' 또는 '2026년 5월 2일' 형태 → '2026-05-02'
    """
    m = re.search(r"(\d{4})[년\s]+(\d{1,2})[월\s]+(\d{1,2})", s)
    if m:
        return f"{m.group(1)}-{m.group(2).zfill(2)}-{m.group(3).zfill(2)}"
    return ""


def parse_slash_date(s: str, base_year: int) -> str:
    """
    '5/2' 또는 '12/31' 형태 → 연도 추정해서 'YYYY-MM-DD'
    """
    m = re.match(r"(\d{1,2})/(\d{1,2})$", s.strip())
    if not m:
        return ""
    month, day = int(m.group(1)), int(m.group(2))
    today = date.today()
    # 월이 현재월보다 훨씬 이전이면 다음 해로 간주 (ex: 지금 11월인데 1월 날짜면 내년)
    year = base_year
    if month < today.month - 2:
        year = base_year + 1
    return f"{year}-{str(month).zfill(2)}-{str(day).zfill(2)}"


def determine_status(reg_start: str, reg_end: str, event_date: str) -> str:
    today = date.today()
    try:
        if reg_start and reg_end:
            rs = date.fromisoformat(reg_start)
            re_ = date.fromisoformat(reg_end)
            if today < rs:
                return "접수예정"
            elif rs <= today <= re_:
                return "접수중"
            else:
                if event_date:
                    try:
                        if today > date.fromisoformat(event_date):
                            return "완료"
                    except Exception:
                        pass
                return "접수마감"
        elif event_date:
            try:
                if today > date.fromisoformat(event_date):
                    return "완료"
            except Exception:
                pass
    except Exception:
        pass
    return "미정"


def parse_detail(no: str) -> dict:
    """detail 페이지에서 접수기간, 지역, 홈페이지 파싱"""
    html = fetch_euckr(DETAIL_BASE + no, delay=0.2)
    if not html:
        return {}

    soup = BeautifulSoup(html, "lxml")
    result = {}

    rows = soup.find_all("tr")
    for row in rows:
        tds = row.find_all("td")
        if len(tds) < 2:
            continue
        label = tds[0].get_text(strip=True)
        value = tds[1].get_text(strip=True)

        if "접수기간" in label:
            # '2026년3월5일~2026년4월12일'
            parts = re.split(r"[~～～]", value)
            if len(parts) >= 2:
                result["registration_start"] = parse_korean_date(parts[0])
                result["registration_end"] = parse_korean_date(parts[1])
        elif "홈페이지" in label:
            a = tds[1].find("a")
            if a:
                result["official_url"] = a.get("href", "").strip()
        elif "대회지역" in label and value:
            result["region_detail"] = value.strip()

    return result


def parse_list_page(html: str) -> list:
    soup = BeautifulSoup(html, "lxml")
    today_year = date.today().year
    marathons = []

    # 리스트 시작 주석 이후의 테이블 rows 파싱
    all_rows = soup.find_all("tr")

    i = 0
    while i < len(all_rows):
        row = all_rows[i]
        tds = row.find_all("td")

        # 구분선 행 스킵
        if len(tds) == 1 and tds[0].find("hr"):
            i += 1
            continue

        # 대회 데이터 행: td 4개
        if len(tds) < 4:
            i += 1
            continue

        # --- 날짜 파싱 (첫 번째 td) ---
        date_td = tds[0]
        date_font = date_td.find("font", attrs={"size": "4"})
        if not date_font:
            i += 1
            continue
        raw_date = date_font.get_text(strip=True)  # e.g. "5/2"
        event_date = parse_slash_date(raw_date, today_year)
        if not event_date:
            i += 1
            continue

        # --- 대회명 + 거리 파싱 (두 번째 td) ---
        name_td = tds[1]
        name_link = name_td.find("a")
        if not name_link:
            i += 1
            continue

        name = name_link.get_text(strip=True)
        if not name:
            i += 1
            continue

        # detail no 추출: javascript:open_window('win', 'view.php?no=41450', ...)
        href = name_link.get("href", "")
        no_match = re.search(r"view\.php\?no=(\d+)", href)
        detail_no = no_match.group(1) if no_match else ""

        # 거리 파싱: <font color="#990000">10km,5km</font>
        dist_font = name_td.find("font", attrs={"color": "#990000"})
        raw_distances = dist_font.get_text(strip=True) if dist_font else ""
        distances = [d.strip() for d in raw_distances.split(",") if d.strip()] if raw_distances else []

        # --- 장소 파싱 (세 번째 td) ---
        location = tds[2].get_text(strip=True)

        # --- 홈페이지 링크 파싱 (네 번째 td) ---
        official_url = ""
        for a in tds[3].find_all("a"):
            href_val = a.get("href", "")
            if href_val.startswith("http") and "roadrun" not in href_val and "marathon.pe.kr" not in href_val:
                official_url = href_val
                break

        mid = hashlib.md5(f"{detail_no or name}{event_date}".encode()).hexdigest()[:8]

        marathons.append({
            "id": mid,
            "detail_no": detail_no,
            "name": name,
            "date": event_date,
            "location": location,
            "region": extract_region(location),
            "distances": distances,
            "registration_start": "",
            "registration_end": "",
            "registration_url": official_url,
            "official_url": official_url,
            "status": "미정",
            "source": "roadrun.co.kr",
            "last_crawled_at": datetime.now().isoformat(),
        })

        i += 1

    # detail_no 기준 중복 제거
    seen = set()
    result = []
    for m in marathons:
        key = m["detail_no"] or m["id"]
        if key not in seen:
            seen.add(key)
            result.append(m)

    return result


def enrich_with_details(marathons: list) -> list:
    """각 대회의 detail 페이지에서 접수기간 등 추가 정보 수집"""
    today = date.today()
    enriched = []
    total = len(marathons)

    for idx, m in enumerate(marathons):
        if not m.get("detail_no"):
            m["status"] = determine_status("", "", m.get("date", ""))
            enriched.append(m)
            continue

        # 이미 완료된 대회는 detail 요청 스킵 (날짜가 30일 이상 지났으면)
        try:
            event_dt = date.fromisoformat(m["date"])
            if (today - event_dt).days > 30:
                m["status"] = "완료"
                enriched.append(m)
                if (idx + 1) % 50 == 0:
                    print(f"[크롤러] 진행: {idx + 1}/{total}")
                continue
        except Exception:
            pass

        detail = parse_detail(m["detail_no"])
        m["registration_start"] = detail.get("registration_start", "")
        m["registration_end"] = detail.get("registration_end", "")
        if detail.get("official_url"):
            m["official_url"] = detail["official_url"]
            if not m["registration_url"]:
                m["registration_url"] = detail["official_url"]
        if detail.get("region_detail"):
            m["region"] = extract_region(detail["region_detail"]) or m["region"]

        m["status"] = determine_status(
            m["registration_start"], m["registration_end"], m["date"]
        )
        enriched.append(m)

        if (idx + 1) % 20 == 0:
            print(f"[크롤러] 진행: {idx + 1}/{total}")

    return enriched


def save_marathons(marathons: list):
    os.makedirs(DATA_DIR, exist_ok=True)
    # detail_no는 내부 필드라 저장 전 제거
    clean = [{k: v for k, v in m.items() if k != "detail_no"} for m in marathons]
    data = {
        "marathons": clean,
        "last_updated": datetime.now().isoformat(),
        "total_count": len(clean),
    }
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"[크롤러] {len(clean)}개 저장 완료 → {DATA_FILE}")


def load_marathons() -> dict:
    if not os.path.exists(DATA_FILE):
        return {"marathons": [], "last_updated": None, "total_count": 0}
    with open(DATA_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def run_crawl() -> list:
    print(f"[크롤러] 시작: {datetime.now().isoformat()}")

    html = fetch_euckr(LIST_URL)
    if not html:
        print("[크롤러] 리스트 페이지 수신 실패")
        return load_marathons().get("marathons", [])

    print("[크롤러] 리스트 파싱 중...")
    marathons = parse_list_page(html)
    print(f"[크롤러] 리스트 파싱 완료: {len(marathons)}개")

    print("[크롤러] 상세 정보 수집 중 (접수기간 등)...")
    marathons = enrich_with_details(marathons)

    # 날짜순 정렬
    marathons.sort(key=lambda m: m.get("date") or "9999")

    save_marathons(marathons)
    print(f"[크롤러] 완료: {len(marathons)}개")
    return marathons
