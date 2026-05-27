function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function urgencyStyle(days) {
  if (days === 0) return "bg-red-500 text-white";
  if (days <= 2) return "bg-red-100 text-red-600 border border-red-200";
  if (days <= 5) return "bg-orange-100 text-orange-600 border border-orange-200";
  return "bg-yellow-50 text-yellow-700 border border-yellow-200";
}

function urgencyLabel(days) {
  if (days === 0) return "오늘 마감!";
  if (days === 1) return "내일 마감!";
  return `D-${days}`;
}

export default function UrgentSection({ marathons }) {
  const urgent = marathons
    .filter((m) => m.status === "접수중" && m.registration_end)
    .map((m) => ({ ...m, days: daysUntil(m.registration_end) }))
    .filter((m) => m.days !== null && m.days >= 0 && m.days <= 7)
    .sort((a, b) => a.days - b.days);

  if (urgent.length === 0) return null;

  return (
    <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⏰</span>
        <h2 className="text-sm font-bold text-orange-700">접수 마감 임박</h2>
        <span className="text-xs text-orange-400">7일 이내 마감 대회</span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {urgent.map((m) => (
          <a
            key={m.id}
            href={m.registration_url || m.official_url || "#"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 bg-white rounded-xl border border-orange-100 p-3 hover:shadow-md transition-shadow w-52 flex flex-col gap-1.5"
          >
            {/* D-day 뱃지 */}
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full self-start ${urgencyStyle(m.days)}`}>
              {urgencyLabel(m.days)}
            </span>

            {/* 대회명 */}
            <p className="text-sm font-bold text-gray-800 line-clamp-2 leading-snug">
              {m.name}
            </p>

            {/* 날짜 + 지역 */}
            <p className="text-xs text-gray-400">{m.date} · {m.region}</p>

            {/* 마감일 */}
            <p className="text-xs text-orange-500 font-medium">
              마감 {m.registration_end}
            </p>
          </a>
        ))}
      </div>
    </div>
  );
}
