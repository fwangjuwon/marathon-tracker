import { useState } from "react";
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

function DdayRow({ marathon: m }) {
  const regDays  = daysUntil(m.registration_end);
  const eventDays = daysUntil(m.date);

  const items = [];

  // 접수 마감 카운트다운
  if (m.status === "접수중" && regDays !== null && regDays >= 0) {
    const label = regDays === 0 ? "오늘 마감!" : `접수 마감 D-${regDays}`;
    const style =
      regDays === 0 ? "bg-red-500 text-white animate-pulse" :
      regDays <= 3  ? "bg-red-100 text-red-600 border border-red-200" :
      regDays <= 7  ? "bg-orange-100 text-orange-500 border border-orange-200" :
                      "bg-green-50 text-green-600 border border-green-200";
    items.push({ label, style });
  }

  // 접수 예정: 시작까지 며칠
  if (m.status === "접수예정" && m.registration_start) {
    const startDays = daysUntil(m.registration_start);
    if (startDays !== null && startDays >= 0) {
      const label = startDays === 0 ? "오늘 접수 시작!" : `접수 시작 D-${startDays}`;
      items.push({ label, style: "bg-blue-50 text-blue-600 border border-blue-200" });
    }
  }

  // 대회까지 D-day (완료/마감 제외)
  if (m.status !== "완료" && eventDays !== null && eventDays >= 0) {
    const label = eventDays === 0 ? "🏁 대회 D-DAY!" : `대회 D-${eventDays}`;
    items.push({ label, style: "bg-gray-100 text-gray-500 border border-gray-200" });
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {items.map(({ label, style }) => (
        <span key={label} className={`text-xs font-bold px-2.5 py-1 rounded-lg ${style}`}>
          {label}
        </span>
      ))}
    </div>
  );
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

function ShareButton({ marathon: m }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const title = m.name;
    const text = [
      `📣 ${m.name}`,
      `📅 대회일: ${m.date}`,
      `📍 장소: ${m.location}`,
      m.registration_start ? `📝 접수: ${m.registration_start} ~ ${m.registration_end ?? "?"}` : null,
      m.registration_url || m.official_url ? `🔗 ${m.registration_url || m.official_url}` : null,
    ].filter(Boolean).join("\n");
    const url = m.registration_url || m.official_url || window.location.href;

    try {
      if (navigator.share) {
        // 모바일: 네이티브 공유 시트 (카카오톡 포함)
        await navigator.share({ title, text, url });
      } else {
        // PC: 클립보드 복사
        await navigator.clipboard.writeText(`${text}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      // 사용자가 취소한 경우 무시
    }
  };

  return (
    <button
      onClick={handleShare}
      title="공유하기"
      className="px-3 text-sm font-medium border border-gray-200 hover:border-yellow-300 hover:bg-yellow-50 text-gray-400 hover:text-yellow-500 py-2 rounded-xl transition-colors relative"
    >
      {copied ? "✅" : "📤"}
      {copied && (
        <span className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
          복사됨!
        </span>
      )}
    </button>
  );
}

export default function MarathonCard({ marathon: m, isFavorite, onToggleFavorite }) {
  const cardStyle = CARD_STYLES[m.status] ?? CARD_STYLES["미정"];
  const favorited = isFavorite?.(m.id) ?? false;

  return (
    <div className={`bg-white rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 p-5 flex flex-col gap-3 ${cardStyle}`}>
      {/* 상태 배지 + D-day + 하트 */}
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
        <div className="flex items-center gap-2">
          <button
            onClick={() => onToggleFavorite?.(m.id)}
            className="text-lg leading-none transition-transform hover:scale-125"
            title={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
          >
            {favorited ? "❤️" : "🤍"}
          </button>
        </div>
      </div>

      {/* 대회명 */}
      <h3 className="font-bold text-gray-900 text-base leading-snug line-clamp-2">
        {m.name}
      </h3>

      {/* D-day */}
      <DdayRow marathon={m} />

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
        <ShareButton marathon={m} />
      </div>
    </div>
  );
}
