export default function LoadingSpinner({ label }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-3">
      <div className="w-8 h-8 border-3 border-[#E2E8F0] border-t-[#4F46E5] rounded-full animate-spin" />
      {label && <p className="text-sm text-[#64748B]">{label}</p>}
    </div>
  );
}
