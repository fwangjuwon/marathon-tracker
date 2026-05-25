export default function Header({ lastUpdated, onRefresh, crawling, total }) {
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

        <button
          onClick={onRefresh}
          disabled={crawling}
          className="flex items-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 disabled:bg-green-300 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
        >
          {crawling ? (
            <>
              <span className="inline-block animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
              크롤링 중...
            </>
          ) : (
            <>🔄 새로고침</>
          )}
        </button>
      </div>
    </header>
  );
}
