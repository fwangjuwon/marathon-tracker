import { useState } from "react";

const STATUS_COLOR = {
  접수중:   "bg-green-100 text-green-700 border-green-200",
  접수예정: "bg-blue-100 text-blue-600 border-blue-200",
  접수마감: "bg-gray-100 text-gray-400 border-gray-200",
  완료:     "bg-gray-50 text-gray-300 border-gray-100",
  미정:     "bg-yellow-50 text-yellow-600 border-yellow-200",
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

  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const toKey = (d) =>
    `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  const isToday = (d) =>
    d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  // 시작일/마감일 기준으로 그룹핑
  const startByDate = {};   // 접수 시작일
  const endByDate = {};     // 접수 마감일

  marathons.forEach((m) => {
    const s = m.registration_start;
    const e = m.registration_end;
    if (s) {
      if (!startByDate[s]) startByDate[s] = [];
      startByDate[s].push(m);
    }
    if (e && e !== s) {
      if (!endByDate[e]) endByDate[e] = [];
      endByDate[e].push(m);
    }
    // 접수 기간 없으면 대회일에 표시
    if (!s && !e && m.date) {
      if (!startByDate[m.date]) startByDate[m.date] = [];
      startByDate[m.date].push(m);
    }
  });

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11); }
    else setMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0); }
    else setMonth((m) => m + 1);
  };

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
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
            <div key={`e-${i}`} className="border-b border-r border-gray-100 min-h-24" />
          );

          const key = toKey(day);
          const starts = startByDate[key] || [];
          const ends = endByDate[key] || [];

          return (
            <div key={day} className={`border-b border-r border-gray-100 min-h-24 p-1 flex flex-col gap-0.5 ${isToday(day) ? "bg-green-50" : ""}`}>
              {/* 날짜 숫자 */}
              <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs mb-0.5 self-start flex-shrink-0
                ${isToday(day) ? "bg-green-600 text-white font-bold" : "text-gray-600"}
              `}>
                {day}
              </span>

              {/* 접수 시작 항목 */}
              {starts.slice(0, 2).map((m) => (
                <a
                  key={"s-" + m.id}
                  href={m.registration_url || m.official_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
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

              {/* 접수 마감 항목 */}
              {ends.slice(0, 2).map((m) => (
                <a
                  key={"e-" + m.id}
                  href={m.registration_url || m.official_url || "#"}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={`${m.name} | 접수: ${m.registration_start} ~ ${m.registration_end} | 대회일: ${m.date}`}
                  className="text-xs px-1.5 py-0.5 rounded border truncate hover:opacity-75 transition-opacity leading-tight bg-red-50 text-red-500 border-red-200"
                >
                  <span className="truncate block">{m.name}</span>
                  <span className="opacity-70 text-xs">🔴 마감일</span>
                </a>
              ))}
              {ends.length > 2 && (
                <span className="text-xs text-red-300 pl-1">+{ends.length - 2}개 마감일</span>
              )}
            </div>
          );
        })}
      </div>

      {/* 범례 */}
      <div className="flex gap-4 mt-3 pt-3 border-t border-gray-100 flex-wrap items-center">
        {[["접수중", "bg-green-500"], ["접수예정", "bg-blue-400"], ["미정", "bg-yellow-300"]].map(([label, color]) => (
          <div key={label} className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-gray-400">{label}</span>
          </div>
        ))}
        <div className="flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span className="text-xs text-gray-400">접수 마감일</span>
        </div>
      </div>
    </div>
  );
}
