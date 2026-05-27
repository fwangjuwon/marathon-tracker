export default function Header({ lastUpdated, total, view, onViewChange }) {
  const formattedTime = lastUpdated
    ? new Date(lastUpdated).toLocaleString("ko-KR", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "없음";

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">🏃‍♂️</div>
          <div>
            <h1 className="text-xl font-black text-gray-900 tracking-tight">
              마라톤 일정 트래커
            </h1>
            <p className="text-xs text-gray-400 mt-0.5">
              {total > 0 ? (
                <>
                  <span className="text-green-600 font-semibold">{total}개</span> 대회 ·{" "}
                </>
              ) : null}
              마지막 업데이트: {formattedTime}
            </p>
          </div>
        </div>

        {/* 뷰 전환 토글 */}
        <div className="flex items-center gap-1 bg-gray-100 rounded-xl p-1">
          <button
            onClick={() => onViewChange("list")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "list"
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            📋 목록
          </button>
          <button
            onClick={() => onViewChange("calendar")}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              view === "calendar"
                ? "bg-white shadow-sm text-gray-800"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            📅 캘린더
          </button>
        </div>
      </div>
    </header>
  );
}
