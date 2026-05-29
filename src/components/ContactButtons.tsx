import { Mail, Phone, MessageCircle } from "lucide-react";

interface Props {
  email?: string;
  phone?: string;
}

export function ContactButtons({ email, phone }: Props) {
  const digits = (phone ?? "").replace(/\D/g, "");
  const wa = digits.startsWith("55") ? digits : `55${digits}`;

  return (
    <div className="flex items-center gap-1.5">
      {email && (
        <a
          href={`mailto:${email}`}
          onClick={(e) => e.stopPropagation()}
          title={email}
          className="w-8 h-8 flex items-center justify-center bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-colors"
        >
          <Mail size={14} />
        </a>
      )}
      {digits && (
        <>
          <a
            href={`tel:+${wa}`}
            onClick={(e) => e.stopPropagation()}
            title={phone}
            className="w-8 h-8 flex items-center justify-center bg-neutral-100 hover:bg-neutral-200 text-neutral-600 rounded-lg transition-colors"
          >
            <Phone size={14} />
          </a>
          <a
            href={`https://wa.me/${wa}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="w-8 h-8 flex items-center justify-center bg-green-500 hover:bg-green-600 text-white rounded-lg transition-colors"
          >
            <MessageCircle size={14} />
          </a>
        </>
      )}
    </div>
  );
}
