export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {Icon && (
        <div className="w-14 h-14 rounded-full bg-[#EEF2FF] flex items-center justify-center mb-4">
          <Icon className="w-7 h-7 text-[#4F46E5]" />
        </div>
      )}

      <h3 className="text-base font-semibold text-[#0F172A] font-[family-name:'Plus_Jakarta_Sans'] mb-1">
        {title}
      </h3>

      {description && (
        <p className="text-sm text-[#64748B] max-w-sm mb-5">{description}</p>
      )}

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="inline-flex items-center justify-center h-[42px] px-5 rounded-lg bg-[#4F46E5] text-white text-sm font-medium hover:bg-[#4338CA] transition-colors cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
