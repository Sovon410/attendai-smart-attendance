import { CheckCircle2, XCircle, Camera, Mic } from "lucide-react";

const typeConfig = {
  face: { label: "Face", icon: Camera },
  voice: { label: "Voice", icon: Mic },
};

export default function BiometricBadge({ type, enrolled }) {
  const config = typeConfig[type] || typeConfig.face;

  if (enrolled) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#ECFDF5] text-[#059669] border border-[#A7F3D0]">
        <CheckCircle2 className="w-3.5 h-3.5" />
        {config.label} Active
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-[#F8FAFC] text-[#64748B] border border-[#CBD5E1]">
      <XCircle className="w-3.5 h-3.5" />
      {config.label} Not Set
    </span>
  );
}
