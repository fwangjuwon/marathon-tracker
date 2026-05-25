import StatusBadge from "./StatusBadge";

const DISTANCE_COLORS = {
  풀코스: "bg-purple-100 text-purple-700",
  하프코스: "bg-blue-100 text-blue-700",
  하프: "bg-blue-100 text-blue-700",
  "10KM": "bg-teal-100 text-teal-700",
  "10km": "bg-teal-100 text-teal-700",
  "5KM": "bg-green-100 text-green-700",
  "5km": "bg-green-100 text-green-700",
};

const CARD_STYLES = {
  접수중:    "border-l-4 border-l-green-500 border-t border-r border-b border-gray-100",
  접수예정:  "border-l-4 border-l-blue-400 border-t border-r border-b border-gray-100",
  접수마감:  "border border-gray-100 opacity-60",
  완료:      "border border-gray-100 opacity-50",
  미정:      "border border-gray-100",
};

function formatDate(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24));
}

function RegCountdown({ regEnd, status }) {
  if (status !== "접수중" || !regEnd) return null;
  const days = daysUntil(regEnd);
  if (days === null || days < 0) return null;
  if (days === 0) return <span className="text-red-500 text-xs font-bold ml-1">오늘 마감!</span>;
  return <span className="text-orange-500 text-xs font-semibold ml-1">({days}일 남음)</span>;
}

function ActionButton({ marathon: m }) {
  const { status, registration_url, official_url } = m;

  if (status === "접수중") {
    return (
      <a
        href={registration_url || official_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm font-bold bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl transition-colors shadow-sm"
      >
        접수하기
      </a>
    );
  }

  if (status === "접수예정") {
    return (
      <a
        href={official_url || registration_url || "#"}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm font-semibold bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 py-2 rounded-xl transition-colors"
      >
        일정 보기
      </a>
    );
  }

  if (status === "접수마감") {
    return (
      <span className="flex-1 text-center text-sm font-medium bg-gray-100 text-gray-400 py-2 rounded-xl cursor-not-allowed">
        접수마감
      </span>
    );
  }

  // 완료 or 미정
  if (official_url) {
    return (
      <a
        href={official_url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex-1 text-center text-sm font-medium text-gray-400 border border-dashed border-gray-200 py-2 rounded-xl hover:border-gray-300 transition-colors"
      >
        공식 사이트
      </a>
    );
  }

  return (
    <span className="flex-1 text-center text-sm font-medium text-gray-300 py-2 rounded-xl border border-dashed border-gray-200">
      접수 정보 없음
    </span>
  );
}

export default function MarathonCard({ marathon: m }) {
  const eventDays = daysUntil(m.date);
  const cardStyle = CARD_STYLES[m.status] ?? CARD_STYLES["미정"];

  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-3 ${cardStyle}`}>
      {/* 상태 배지 + D-day */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {m.status === "접수중" && (
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
            </span>
          )}
          <StatusBadge status={m.status} />
        </div>
        {eventDays !== null && eventDays >= 0 && (
          <span className="text-xs font-bold text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
            {eventDays === 0 ? "D-DAY" : `D-${eventDays}`}
          </span>
        )}
      </div>

      {/* 대회명 */}
      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
        {m.name}
      </h3>

      {/* 날짜 + 장소 */}
      <div className="flex flex-col gap-1">
        <p className="text-sm font-semibold text-green-600">
          📅 {formatDate(m.date)}
        </p>
        {m.location && (
          <p className="text-sm text-gray-500">📍 {m.location}</p>
        )}
      </div>

      {/* 거리 태그 */}
      {m.distances?.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {m.distances.map((d, i) => (
            <span
              key={i}
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                DISTANCE_COLORS[d] ?? "bg-gray-100 text-gray-600"
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      )}

      {/* 접수 기간 */}
      {(m.registration_start || m.registration_end) && (
        <div className="text-xs text-gray-400 flex items-center flex-wrap gap-0.5">
          <span>접수</span>
          <span className="font-medium text-gray-500">{m.registration_start ?? "?"}</span>
          <span>~</span>
          <span className="font-medium text-gray-500">{m.registration_end ?? "?"}</span>
          <RegCountdown regEnd={m.registration_end} status={m.status} />
        </div>
      )}

      {/* 버튼 */}
      <div className="flex gap-2 mt-auto pt-2 border-t border-gray-50">
        <ActionButton marathon={m} />
        {m.official_url && m.official_url !== m.registration_url && m.status === "접수중" && (
          <a
            href={m.official_url}
            target="_blank"
            rel="noopener noreferrer"
            className="px-3 text-sm font-medium border border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 py-2 rounded-xl transition-colors"
          >
            공식
          </a>
        )}
      </div>
    </div>
  );
}
