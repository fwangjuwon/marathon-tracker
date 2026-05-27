import os
import threading
from contextlib import asynccontextmanager
from typing import Optional

from apscheduler.schedulers.background import BackgroundScheduler
from fastapi import BackgroundTasks, FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

from crawler import load_marathons, run_crawl

scheduler = BackgroundScheduler()


@asynccontextmanager
async def lifespan(app: FastAPI):
    data = load_marathons()
    if not data.get("marathons"):
        thread = threading.Thread(target=run_crawl, daemon=True)
        thread.start()

    scheduler.add_job(run_crawl, "interval", hours=6, id="auto_crawl", replace_existing=True)
    scheduler.start()

    yield

    scheduler.shutdown(wait=False)


app = FastAPI(title="마라톤 트래커 API", lifespan=lifespan)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173,http://localhost:3000")
origins = [o.strip() for o in ALLOWED_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/marathons")
def get_marathons(
    region: Optional[str] = Query(None),
    event_month: Optional[int] = Query(None),
    reg_month: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    distance: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
):
    data = load_marathons()
    marathons = data.get("marathons", [])

    if region:
        marathons = [m for m in marathons if m.get("region") == region]
    if event_month:
        target = f"-{str(event_month).zfill(2)}-"
        marathons = [m for m in marathons if target in (m.get("date") or "")]
    if reg_month:
        target = f"-{str(reg_month).zfill(2)}-"
        marathons = [m for m in marathons if target in (m.get("registration_start") or "")]
    if status:
        marathons = [m for m in marathons if m.get("status") == status]
    if distance:
        if distance == "기타":
            MAIN_DISTANCES = {"풀", "하프", "10km", "5km"}
            marathons = [
                m for m in marathons
                if any(
                    not any(main in d.lower() for main in MAIN_DISTANCES)
                    for d in m.get("distances", [])
                )
            ]
        else:
            marathons = [m for m in marathons if any(distance.lower() in d.lower() for d in m.get("distances", []))]
    if search:
        kw = search.lower().replace(" ", "")
        marathons = [
            m for m in marathons
            if kw in (m.get("name") or "").lower().replace(" ", "")
            or kw in (m.get("location") or "").lower().replace(" ", "")
        ]

    # 상태 우선순위: 접수중 → 접수예정 → 접수마감 → 미정 → 완료
    STATUS_ORDER = {"접수중": 0, "접수예정": 1, "접수마감": 2, "미정": 3, "완료": 4}
    marathons.sort(key=lambda m: (
        STATUS_ORDER.get(m.get("status"), 3),
        m.get("date") or "9999"
    ))

    return {
        "marathons": marathons,
        "total": len(marathons),
        "last_updated": data.get("last_updated"),
    }


@app.post("/api/crawl")
def trigger_crawl(background_tasks: BackgroundTasks):
    background_tasks.add_task(run_crawl)
    return {"message": "크롤링이 시작되었습니다"}


@app.get("/api/status")
def get_status():
    data = load_marathons()
    return {
        "last_updated": data.get("last_updated"),
        "total_count": data.get("total_count", 0),
    }
