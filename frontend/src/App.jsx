import { useCallback, useEffect, useState } from "react";
import CalendarView from "./components/CalendarView";
import FilterBar from "./components/FilterBar";
import Header from "./components/Header";
import MarathonCard from "./components/MarathonCard";
import UrgentSection from "./components/UrgentSection";
import { useFavorites } from "./hooks/useFavorites";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const INITIAL_FILTERS = { region: "", event_month: "", reg_month: "", status: "", distance: "", search: "" };

export default function App() {
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);
  const [view, setView] = useState("list");
  const [showFavOnly, setShowFavOnly] = useState(false);

  const { favorites, toggleFavorite, isFavorite } = useFavorites();

  const fetchMarathons = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, v));
      const res = await fetch(`${API_BASE}/api/marathons?${params}`);
      if (!res.ok) throw new Error(`서버 오류: ${res.status}`);
      const data = await res.json();
      setMarathons(data.marathons ?? []);
      setLastUpdated(data.last_updated);
    } catch (e) {
      setError(e.message);
      setMarathons([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchMarathons();
  }, [fetchMarathons]);

  // 즐겨찾기 필터 적용
  const displayedMarathons = showFavOnly
    ? marathons.filter((m) => isFavorite(m.id))
    : marathons;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lastUpdated={lastUpdated}
        total={marathons.length}
        view={view}
        onViewChange={setView}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <FilterBar filters={filters} onChange={setFilters} />
        {!loading && !error && <UrgentSection marathons={marathons} />}

        {/* 에러 */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-600">
            ⚠️ 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
          </div>
        )}

        {/* 로딩 */}
        {loading && !error && (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-200 border-t-green-600" />
            <p className="text-gray-400 text-sm">대회 정보를 불러오는 중...</p>
          </div>
        )}

        {/* 카드 그리드 / 캘린더 */}
        {!loading && !error && marathons.length > 0 && (
          <>
            {/* 카운트 + 즐겨찾기 토글 */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-400">
                총{" "}
                <span className="text-green-600 font-semibold">{displayedMarathons.length}개</span>{" "}
                대회
              </p>
              <button
                onClick={() => setShowFavOnly((v) => !v)}
                className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-xl border transition-colors ${
                  showFavOnly
                    ? "bg-red-50 border-red-200 text-red-500 font-semibold"
                    : "bg-white border-gray-200 text-gray-400 hover:border-gray-300"
                }`}
              >
                {showFavOnly ? "❤️" : "🤍"}
                즐겨찾기
                {favorites.size > 0 && (
                  <span className={`text-xs rounded-full px-1.5 py-0.5 ${showFavOnly ? "bg-red-100 text-red-500" : "bg-gray-100 text-gray-500"}`}>
                    {favorites.size}
                  </span>
                )}
              </button>
            </div>

            {/* 즐겨찾기 필터 시 결과 없음 */}
            {showFavOnly && displayedMarathons.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <div className="text-5xl mb-3">🤍</div>
                <p className="font-medium">즐겨찾기한 대회가 없어요</p>
                <p className="text-sm mt-1">카드의 하트를 눌러 추가해보세요</p>
              </div>
            )}

            {view === "calendar" ? (
              <CalendarView marathons={displayedMarathons} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {displayedMarathons.map((m) => (
                  <MarathonCard
                    key={m.id}
                    marathon={m}
                    isFavorite={isFavorite}
                    onToggleFavorite={toggleFavorite}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {/* 결과 없음 (필터 적용 시) */}
        {!loading && !error && marathons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="text-6xl mb-4">🏁</div>
            <p className="text-lg font-medium">검색된 대회가 없습니다</p>
            <p className="text-sm mt-1">필터를 조정해보세요</p>
          </div>
        )}
      </main>

      <footer className="mt-12 py-6 border-t border-gray-100 text-center text-xs text-gray-300">
        © 2026 gaeddo · Made with ❤️
      </footer>
    </div>
  );
}
