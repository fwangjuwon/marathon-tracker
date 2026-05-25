const REGIONS = [
  "서울", "경기", "인천", "강원", "충북", "충남", "대전", "세종",
  "전북", "전남", "광주", "경북", "경남", "대구", "부산", "울산", "제주", "기타",
];
const STATUSES = ["접수예정", "접수중", "접수마감", "완료", "미정"];
const DISTANCES = ["풀코스", "하프코스", "10KM", "5KM"];
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

const selectClass =
  "border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100 cursor-pointer";

export default function FilterBar({ filters, onChange }) {
  const set = (key) => (e) => onChange((prev) => ({ ...prev, [key]: e.target.value }));
  const clear = () =>
    onChange({ region: "", month: "", status: "", distance: "", search: "" });

  const activeCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap gap-3 items-center">
        {/* 검색 */}
        <div className="relative flex-1 min-w-48">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="대회명 또는 장소 검색..."
            value={filters.search}
            onChange={set("search")}
            className="w-full border border-gray-200 rounded-xl pl-8 pr-3 py-2 text-sm outline-none focus:border-green-400 focus:ring-2 focus:ring-green-100"
          />
        </div>

        {/* 지역 */}
        <select value={filters.region} onChange={set("region")} className={selectClass}>
          <option value="">전체 지역</option>
          {REGIONS.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>

        {/* 월 */}
        <select value={filters.month} onChange={set("month")} className={selectClass}>
          <option value="">전체 월</option>
          {MONTHS.map((m) => (
            <option key={m} value={m}>{m}월</option>
          ))}
        </select>

        {/* 상태 */}
        <select value={filters.status} onChange={set("status")} className={selectClass}>
          <option value="">전체 상태</option>
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>

        {/* 거리 */}
        <select value={filters.distance} onChange={set("distance")} className={selectClass}>
          <option value="">전체 거리</option>
          {DISTANCES.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>

        {/* 초기화 */}
        {activeCount > 0 && (
          <button
            onClick={clear}
            className="text-sm text-gray-400 hover:text-red-500 px-2 py-2 transition-colors flex items-center gap-1"
          >
            ✕ 초기화
            <span className="bg-red-100 text-red-500 text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold">
              {activeCount}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
