import { useCallback, useEffect, useState } from "react";
import FilterBar from "./components/FilterBar";
import Header from "./components/Header";
import MarathonCard from "./components/MarathonCard";

const API_BASE = import.meta.env.VITE_API_URL ?? "";
const INITIAL_FILTERS = { region: "", month: "", status: "", distance: "", search: "" };

export default function App() {
  const [marathons, setMarathons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [crawling, setCrawling] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(INITIAL_FILTERS);

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

  const handleCrawl = async () => {
    setCrawling(true);
    try {
      await fetch(`${API_BASE}/api/crawl`, { method: "POST" });
      setTimeout(() => {
        fetchMarathons();
        setCrawling(false);
      }, 4000);
    } catch {
      setCrawling(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        lastUpdated={lastUpdated}
        onRefresh={handleCrawl}
        crawling={crawling}
        total={marathons.length}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-5">
        <FilterBar filters={filters} onChange={setFilters} />

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

        {/* 결과 없음 */}
        {!loading && !error && marathons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-gray-400">
            <div className="text-6xl mb-4">🏁</div>
            <p className="text-lg font-medium">검색된 대회가 없습니다</p>
            <p className="text-sm mt-1">필터를 조정하거나 새로고침을 눌러보세요</p>
          </div>
        )}

        {/* 카드 그리드 */}
        {!loading && !error && marathons.length > 0 && (
          <>
            <p className="text-sm text-gray-400">
              총{" "}
              <span className="text-green-600 font-semibold">{marathons.length}개</span>{" "}
              대회
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {marathons.map((m) => (
                <MarathonCard key={m.id} marathon={m} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
