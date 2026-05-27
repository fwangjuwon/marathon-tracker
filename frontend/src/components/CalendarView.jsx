import { useState } from "react";

const STATUS_COLOR = {
  접수중:   "bg-green-100 text-green-700 border-green-200",
  접수예정: "bg-blue-100 text-blue-600 border-blue-200",
  접수마감: "bg-gray-100 text-gray-400 border-gray-200",
  완료:     "bg-gray-50 text-gray-300 border-gray-100",
  미정:     "bg-yellow-50 text-yellow-600 border-yellow-200",
};

const STATUS_DOT = {
  접수중:   "bg-green-500",
  접수예정: "bg-blue-400",
  접수마감: "bg-gray-300",
  완료:     "bg-gray-200",
  미정:     "bg-yellow-300",
};

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function fmtShort(dateStr) {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

export default function CalendarView({ marathons }) {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());
  const [selectedDay, setSelectedDay] = useState(null);

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toKey = (d) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // 시작일 / 마감일 그룹핑
  const startByDate = {};
  const endByDate = {};

  marathons.forEach((m) => {
    const s = m.registration_start;
    const e = m.registration_end;
    if (s) {
      if (!startByDate[s]) startByDate[s] = [];
      startByDate[s].push({ ...m, type: "start" });
    }
    if (e && e !== s) {
      if (!endByDate[e]) endByDate[e] = [];
      endByDate[e].push({ ...m, type: "end" });
    }
    if (!s && !e && m.date) {
      if (!startByDate[m.date]) startByDate[m.date] = [];
      startByDate[m.date].push({ ...m, type: "start" });
    }
  });

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
    setSelectedDay(null);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
    setSelectedDay(null);
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  // 선택된 날 항목
  const selectedKey = selectedDay ? toKey(selectedDay) : null;
  const selectedItems = selectedKey
    ? [
        ...(startByDate[selectedKey] || []),
        ...(endByDate[selectedKey] || []),
      ]
    : [];

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
      {/* 월 네비게이션 */}
      <div className="flex items-center justify-between mb-4">
        <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors text-sm">◀</button>
        <span className="font-bold text-gray-800">{year}년 {month + 1}월</span>
        <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors text-sm">▶</button>
      </div>

      {/* 요일 헤더 */}
      <div className="grid grid-cols-7 border-b border-gray-100">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-xs font-medium py-1.5 ${i === 0 ? "text-red-400" : i === 6 ? "text-blue-400" : "text-gray-400"}`}>
            {d}
          </div>
        ))}
      </div>

      {/* 날짜 그리드 */}
      <div className="grid grid-cols-7 border-l border-gray-100">
        {cells.map((day, i) => {
          if (!day) return (
            <div key={`e-${i}`} className="border-b border-r border-gray-100 min-h-10 sm:min-h-24" />
          );

          const key = toKey(day);
          const starts = startByDate[key] || [];
          const ends = endByDate[key] || [];
          const allItems = [...starts, ...ends];
          const isSelected = day === selectedDay;

          return (
            <div
              key={day}
              onClick={() => setSelectedDay(isSelected ? null : day)}
              className={`border-b border-r border-gray-100 flex flex-col cursor-pointer transition-colors
                min-h-10 sm:min-h-24
                p-0.5 sm:p-1
                ${isToday(day) ? "bg-green-50" : ""}
                ${isSelected ? "ring-1 ring-inset ring-green-400" : "hover:bg-gray-50"}
              `}
            >
              {/* 날짜 숫자 */}
              <span className={`w-5 h-5 sm:w-6 sm:h-6 flex items-center justify-center rounded-full text-xs self-start flex-shrink-0
                ${isToday(day) ? "bg-green-600 text-white font-bold" : "text-gray-600"}
              `}>
                {day}
              </span>

              {/* 모바일: 점(dot)만 표시 */}
              {allItems.length > 0 && (
                <div className="flex sm:hidden flex-wrap gap-px px-0.5 mt-0.5">
                  {allItems.slice(0, 4).map((m, idx) => (
                    <div
                      key={idx}
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0
                        ${m.type === "end" ? "bg-red-400" : STATUS_DOT[m.status] || "bg-gray-300"}
                      `}
                    />
                  ))}
                  {allItems.length > 4 && (
                    <span className="text-gray-400" style={{ fontSize: "8px" }}>+{allItems.length - 4}</span>
                  )}
                </div>
              )}

              {/* 데스크탑: 텍스트 칩 표시 */}
              <div className="hidden sm:flex flex-col gap-0.5 mt-0.5">
                {starts.slice(0, 2).map((m) => (
                  <a
                    key={"s-" + m.id}
                    href={m.registration_url || m.official_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    title={`${m.name} | 접수: ${m.registration_start} ~ ${m.registration_end} | 대회일: ${m.date}`}
                    className={`text-xs px-1.5 py-0.5 rounded border truncate hover:opacity-75 transition-opacity leading-tight
                      ${STATUS_COLOR[m.status] || STATUS_COLOR["미정"]}
                    `}
                  >
                    <span className="truncate block">{m.name}</span>
                    {m.registration_end && (
                      <span className="opacity-60 text-xs">마감 {fmtShort(m.registration_end)}</span>
                    )}
                  </a>
                ))}
                {starts.length > 2 && (
                  <span className="text-xs text-gray-400 pl-1">+{starts.length - 2}개</span>
                )}
                {ends.slice(0, 2).map((m) => (
                  <a
                    key={"e-" + m.id}
                    href={m.registration_url || m.official_url || "#"}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs px-1.5 py-0.5 rounded border truncate hover:opacity-75 leading-tight bg-red-50 text-red-500 border-red-200"
                  >
                    <span className="truncate block">{m.name}</span>
                    <span className="opacity-70 text-xs">🔴 마감일</span>
                  </a>
                ))}
                {ends.length > 2 && (
                  <span className="text-xs text-red-300 pl-1">+{ends.length - 2}개 마감</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 선택된 날 상세 (모바일+데스크탑 공통) */}
      {selectedDay && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <p className="text-sm font-bold text-gray-700 mb-2">
            {month + 1}월 {selectedDay}일 · {selectedItems.length}개
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-xs text-gray-400">일정이 없습니다</p>
          ) : (
            <div className="flex flex-col gap-2">
              {selectedItems.map((m, idx) => (
                <a
                  key={idx}
                  href={m.registration_url || m.official_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-3 rounded-xl border text-sm flex flex-col gap-0.5
                    ${m.type === "end" ? "bg-red-50 border-red-200" : STATUS_COLOR[m.status] || STATUS_COLOR["미정"]}
                  `}
                >
                  <span className="font-semibold">{m.name}</span>
                  <span className="text-xs opacity-70">
                    {m.type === "end" ? "🔴 접수 마감일" : "🟢 접수 시작일"}
                    {" · "}{m.location}
                  </span>
                  {m.registration_end && m.type !== "end" && (
                    <span className="text-xs opacity-60">마감 {fmtShort(m.registration_end)}</span>
                  )}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 범례 */}
      <div className="flex gap-3 mt-3 pt-3 border-t border-gray-100 flex-wrap items-center">
        {[["접수중", "bg-green-500"], ["접수예정", "bg-blue-400"], ["미정", "bg-yellow-300"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-gray-400">마감일</span>
        </div>
        <span className="text-xs text-gray-300 ml-auto">날짜 클릭 → 상세보기</span>
      </div>
    </div>
  );
}
