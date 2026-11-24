const statusConfig = {
  present: {
    label: "Present",
    bg: "bg-[#ECFDF5]",
    text: "text-[#059669]",
    border: "border-[#A7F3D0]",
  },
  absent: {
    label: "Absent",
    bg: "bg-[#FFF1F2]",
    text: "text-[#E11D48]",
    border: "border-[#FECDD3]",
  },
  late: {
    label: "Late",
    bg: "bg-[#FFFBEB]",
    text: "text-[#D97706]",
    border: "border-[#FDE68A]",
  },
};

export default function StatusBadge({ status }) {
  const config = statusConfig[status] || statusConfig.absent;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      {config.label}
    </span>
  );
}
