const colorConfig = {
  primary: {
    iconBg: "bg-[#EEF2FF]",
    iconText: "text-[#4F46E5]",
  },
  teal: {
    iconBg: "bg-[#ECFDF5]",
    iconText: "text-[#0D9488]",
  },
  violet: {
    iconBg: "bg-[#F5F3FF]",
    iconText: "text-[#7C3AED]",
  },
};

export default function KPICard({
  label,
  value,
  icon: Icon,
  color = "primary",
  subtitle,
}) {
  const colors = colorConfig[color] || colorConfig.primary;

  return (
    <div className="bg-white rounded-xl border border-[#E2E8F0] shadow-sm p-5 flex items-center gap-4">
      {Icon && (
        <div
          className={`w-12 h-12 rounded-xl ${colors.iconBg} flex items-center justify-center shrink-0`}
        >
          <Icon className={`w-6 h-6 ${colors.iconText}`} />
        </div>
      )}

      <div className="min-w-0">
        <p className="text-2xl font-bold text-[#0F172A] font-[family-name:'Plus_Jakarta_Sans'] tabular-nums leading-tight">
          {value}
        </p>
        <p className="text-sm text-[#64748B] truncate">{label}</p>
        {subtitle && (
          <p className="text-xs text-[#64748B] mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );
}
