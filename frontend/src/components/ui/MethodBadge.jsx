import { Camera, Mic, Pencil } from "lucide-react";

const methodConfig = {
  photo: {
    label: "Photo",
    icon: Camera,
    bg: "bg-[#F5F3FF]",
    text: "text-[#7C3AED]",
    border: "border-[#7C3AED]/20",
  },
  voice: {
    label: "Voice",
    icon: Mic,
    bg: "bg-[#ECFDF5]",
    text: "text-[#0D9488]",
    border: "border-[#0D9488]/20",
  },
  manual: {
    label: "Manual",
    icon: Pencil,
    bg: "bg-[#F8FAFC]",
    text: "text-[#64748B]",
    border: "border-[#CBD5E1]",
  },
};

export default function MethodBadge({ method }) {
  const config = methodConfig[method] || methodConfig.manual;
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${config.bg} ${config.text} ${config.border}`}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
