const STATUS_STYLES = {
  접수중: "bg-green-100 text-green-700 border-green-200",
  접수예정: "bg-blue-100 text-blue-700 border-blue-200",
  접수마감: "bg-red-100 text-red-600 border-red-200",
  완료: "bg-gray-100 text-gray-400 border-gray-200",
  미정: "bg-yellow-100 text-yellow-700 border-yellow-200",
};

export default function StatusBadge({ status }) {
  const style = STATUS_STYLES[status] ?? STATUS_STYLES["미정"];
  return (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${style}`}>
      {status ?? "미정"}
    </span>
  );
}
