import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/")({
  component: ChurchPage,
  head: () => ({
    meta: [
      { title: "Igreja Comunidade da Graça" },
      { name: "description", content: "Um lugar de fé, amor e comunidade." },
    ],
  }),
});

// ── Mock data (substituir por fetch do Supabase via tenant_id/slug) ──────────
const CHURCH = {
  name: "Igreja Comunidade da Graça",
  tagline: "Um lugar de fé, amor e comunidade",
  logo: null as string | null,
  primaryColor: "#1a3a5c",
  accentColor: "#C9993A",
  coverPhoto: null as string | null,
};

type EventItem = {
  id: number;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  image: string;
  ticketUrl: string;
  free: boolean;
  price?: string;
  spots: number;
};

const EVENTS: EventItem[] = [
  {
    id: 1,
    title: "Culto de Celebração",
    date: "2025-05-18",
    time: "18:00",
    location: "Templo Central, Caruaru - PE",
    description: "Uma noite especial de louvor, adoração e palavra. Venha com sua família!",
    image: "https://images.unsplash.com/photo-1438232992991-995b7058bbb3?w=600&q=80",
    ticketUrl: "https://bilheteria.exemplo.com/culto-celebracao",
    free: true,
    spots: 320,
  },
  {
    id: 2,
    title: "Conferência Jovem 2025",
    date: "2025-06-07",
    time: "09:00",
    location: "Centro de Convenções, Recife - PE",
    description: "Dois dias de imersão para jovens com pregações, workshops e muita música.",
    image: "https://images.unsplash.com/photo-1529070538774-1843cb3265df?w=600&q=80",
    ticketUrl: "https://bilheteria.exemplo.com/conf-jovem-2025",
    free: false,
    price: "R$ 45,00",
    spots: 180,
  },
  {
    id: 3,
    title: "Retiro Família",
    date: "2025-06-28",
    time: "08:00",
    location: "Sítio Recanto Verde, Gravatá - PE",
    description: "Um final de semana inteiro para restaurar laços familiares em plena natureza.",
    image: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?w=600&q=80",
    ticketUrl: "https://bilheteria.exemplo.com/retiro-familia",
    free: false,
    price: "R$ 120,00",
    spots: 60,
  },
];

const PIX_KEY = "33.385.082/0001-99";

// ── Utility ──────────────────────────────────────────────────────────────────
function formatDate(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
}

function initials(name: string) {
  return name.split(" ").filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase();
}

// ── QR Code SVG (mock visual — em produção usar qrcode.react) ─────────────
function QRCodeSVG({ size = 180, primary }: { size?: number; primary: string }) {
  const cells = 21;
  const cell = size / cells;
  const seed: [number, number][] = [
    [0, 0], [1, 0], [2, 0], [3, 0], [4, 0], [5, 0], [6, 0],
    [0, 1], [6, 1], [0, 2], [2, 2], [3, 2], [4, 2], [6, 2],
    [0, 3], [2, 3], [3, 3], [4, 3], [6, 3], [0, 4], [2, 4], [3, 4], [4, 4], [6, 4],
    [0, 5], [6, 5], [0, 6], [1, 6], [2, 6], [3, 6], [4, 6], [5, 6], [6, 6],
    [14, 0], [15, 0], [16, 0], [17, 0], [18, 0], [19, 0], [20, 0],
    [14, 1], [20, 1], [14, 2], [16, 2], [17, 2], [18, 2], [20, 2],
    [14, 3], [16, 3], [17, 3], [18, 3], [20, 3], [14, 4], [16, 4], [17, 4], [18, 4], [20, 4],
    [14, 5], [20, 5], [14, 6], [15, 6], [16, 6], [17, 6], [18, 6], [19, 6], [20, 6],
    [0, 14], [1, 14], [2, 14], [3, 14], [4, 14], [5, 14], [6, 14],
    [0, 15], [6, 15], [0, 16], [2, 16], [3, 16], [4, 16], [6, 16],
    [0, 17], [2, 17], [3, 17], [4, 17], [6, 17], [0, 18], [2, 18], [3, 18], [4, 18], [6, 18],
    [0, 19], [6, 19], [0, 20], [1, 20], [2, 20], [3, 20], [4, 20], [5, 20], [6, 20],
  ];
  const extra: [number, number][] = [];
  for (let r = 8; r < 21; r++) {
    for (let c = 8; c < 21; c++) {
      if ((r + c * 3 + r * c) % 3 === 0) extra.push([c, r]);
    }
  }
  for (let r = 0; r < 7; r++) {
    for (let c = 8; c < 14; c++) {
      if ((r * 7 + c) % 2 === 0) extra.push([c, r]);
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <rect width={size} height={size} fill="#fff" />
      {[...seed, ...extra].map(([c, r], i) => (
        <rect key={i} x={c * cell} y={r * cell} width={cell} height={cell} fill={primary} />
      ))}
    </svg>
  );
}

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, accent, primary }: { event: EventItem; accent: string; primary: string }) {
  const [hovered, setHovered] = useState(false);
  const month = new Date(event.date + "T12:00:00")
    .toLocaleDateString("pt-BR", { month: "short" })
    .replace(".", "")
    .toUpperCase();
  const day = new Date(event.date + "T12:00:00").getDate();

  return (
    <a
      href={event.ticketUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        borderRadius: 16,
        overflow: "hidden",
        background: "#fff",
        boxShadow: hovered ? "0 20px 60px rgba(0,0,0,0.18)" : "0 4px 24px rgba(0,0,0,0.08)",
        transform: hovered ? "translateY(-6px)" : "translateY(0)",
        transition: "all 0.35s cubic-bezier(0.34,1.56,0.64,1)",
        display: "flex",
        flexDirection: "column",
        textDecoration: "none",
        color: "inherit",
      }}
    >
      {/* Image */}
      <div style={{ position: "relative", height: 180, overflow: "hidden" }}>
        <img
          src={event.image}
          alt={event.title}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hovered ? "scale(1.08)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        />
        {/* Badge gratuito/pago */}
        <div
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            padding: "6px 12px",
            background: "rgba(255,255,255,0.95)",
            color: primary,
            borderRadius: 999,
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          {event.free ? "GRATUITO" : event.price}
        </div>
        {/* Date badge */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            left: 12,
            background: "#fff",
            borderRadius: 12,
            padding: "8px 12px",
            textAlign: "center",
            minWidth: 56,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: primary, lineHeight: 1, fontWeight: 800 }}>
            {day}
          </div>
          <div style={{ fontSize: 10, color: "#666", letterSpacing: 1, marginTop: 2 }}>{month}</div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: 24, flex: 1, display: "flex", flexDirection: "column" }}>
        <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: 20, margin: "0 0 12px", color: primary }}>
          {event.title}
        </h3>

        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#666", fontSize: 13, marginBottom: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span>
            {event.time} · {formatDate(event.date)}
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#666", fontSize: 13, marginBottom: 12 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <span>{event.location}</span>
        </div>

        <p
          style={{
            color: "#555",
            fontSize: 14,
            lineHeight: 1.5,
            margin: "0 0 16px",
            flex: 1,
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {event.description}
        </p>

        {/* CTA */}
        <div style={{ marginTop: "auto", paddingTop: 12, borderTop: "1px solid #f0f0f0", color: accent, fontWeight: 600, fontSize: 14 }}>
          {event.free ? "Confirmar Presença →" : "Comprar Ingresso →"}
        </div>
      </div>
    </a>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
function ChurchPage() {
  const [copied, setCopied] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const primary = CHURCH.primaryColor;
  const accent = CHURCH.accentColor;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyPix = () => {
    navigator.clipboard?.writeText(PIX_KEY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif", background: "#fafaf7", color: "#1a1a1a", minHeight: "100vh" }}>
      {/* Google Fonts */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=DM+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulse-ring {
          0%   { transform: scale(1);   opacity: 0.6; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .fade-up { animation: fadeUp 0.7s ease both; }
        .fade-up-2 { animation: fadeUp 0.7s 0.15s ease both; }
        .fade-up-3 { animation: fadeUp 0.7s 0.3s ease both; }
        .fade-up-4 { animation: fadeUp 0.7s 0.45s ease both; }

        .copy-btn:hover { background: ${primary} !important; color: #fff !important; }
        .donate-link:hover { opacity: 0.85; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: ${accent}; border-radius: 3px; }
      `}</style>

      {/* Sticky top bar */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: scrolled ? "rgba(255,255,255,0.92)" : "transparent",
          backdropFilter: scrolled ? "blur(12px)" : "none",
          borderBottom: scrolled ? "1px solid rgba(0,0,0,0.06)" : "1px solid transparent",
          transition: "all .3s ease",
        }}
      >
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "14px 24px", display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 999,
              background: primary,
              color: "#fff",
              display: "grid",
              placeItems: "center",
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            {initials(CHURCH.name)}
          </div>
          <span style={{ fontWeight: 600, color: scrolled ? "#1a1a1a" : "transparent", transition: "color .3s" }}>
            {CHURCH.name}
          </span>
        </div>
      </div>

      {/* ── HERO / HEADER ──────────────────────────────────────────────── */}
      <section
        style={{
          position: "relative",
          padding: "80px 24px 100px",
          textAlign: "center",
          background: `linear-gradient(135deg, ${primary} 0%, ${primary}dd 100%)`,
          color: "#fff",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 320,
            height: 320,
            borderRadius: "50%",
            background: `${accent}22`,
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -160,
            left: -160,
            width: 400,
            height: 400,
            borderRadius: "50%",
            background: `${accent}18`,
          }}
        />

        <div className="fade-up" style={{ position: "relative", maxWidth: 800, margin: "0 auto" }}>
          {/* Logo */}
          <div style={{ marginBottom: 24 }}>
            {CHURCH.logo ? (
              <img
                src={CHURCH.logo}
                alt={CHURCH.name}
                style={{ width: 96, height: 96, borderRadius: 999, objectFit: "cover", margin: "0 auto", border: `3px solid ${accent}` }}
              />
            ) : (
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 999,
                  background: "#fff",
                  color: primary,
                  display: "grid",
                  placeItems: "center",
                  fontSize: 32,
                  fontWeight: 800,
                  margin: "0 auto",
                  border: `3px solid ${accent}`,
                }}
              >
                {initials(CHURCH.name)}
              </div>
            )}
          </div>

          {/* Church Name */}
          <h1
            style={{
              fontFamily: "'Playfair Display', Georgia, serif",
              fontSize: "clamp(2.2rem, 6vw, 3.6rem)",
              lineHeight: 1.1,
              margin: "0 0 16px",
            }}
          >
            {CHURCH.name}
          </h1>
          <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.25rem)", opacity: 0.9, margin: 0, fontWeight: 300 }}>
            {CHURCH.tagline}
          </p>

          {/* Divider */}
          <div style={{ width: 60, height: 3, background: accent, margin: "32px auto 0", borderRadius: 2 }} />
        </div>
      </section>

      {/* ── DONATION / QR CODE SECTION ─────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: 720, margin: "0 auto" }}>
        {/* Section Title */}
        <div className="fade-up" style={{ textAlign: "center", marginBottom: 40 }}>
          <span style={{ fontSize: 12, letterSpacing: 3, color: accent, fontWeight: 600 }}>
            ✦ CONTRIBUA COM A OBRA
          </span>
          <h2
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
              margin: "12px 0 8px",
              color: primary,
            }}
          >
            Faça sua doação via PIX
          </h2>
          <p style={{ color: "#666", margin: 0 }}>
            Escaneie o QR Code ou copie a chave abaixo.
            <br />
            Toda doação é recebida com gratidão e fé.
          </p>
        </div>

        {/* QR Code Card */}
        <div
          className="fade-up-2"
          style={{
            background: "#fff",
            borderRadius: 24,
            padding: "40px 32px",
            boxShadow: "0 10px 40px rgba(0,0,0,0.08)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Subtle top bar */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 4,
              background: `linear-gradient(90deg, ${primary}, ${accent})`,
            }}
          />

          {/* Live indicator */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 8, marginBottom: 24 }}>
            <span style={{ position: "relative", display: "inline-flex" }}>
              <span
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 999,
                  background: "#22c55e",
                  animation: "pulse-ring 1.6s ease-out infinite",
                }}
              />
              <span style={{ width: 8, height: 8, borderRadius: 999, background: "#22c55e", display: "inline-block" }} />
            </span>
            <span style={{ fontSize: 12, color: "#666", fontWeight: 500 }}>Chave PIX ativa</span>
          </div>

          {/* QR Code */}
          <div style={{ display: "grid", placeItems: "center", marginBottom: 24 }}>
            <div style={{ padding: 16, background: "#fff", border: `2px solid ${primary}11`, borderRadius: 16 }}>
              <QRCodeSVG primary={primary} />
            </div>
          </div>

          {/* Church name below QR */}
          <div style={{ textAlign: "center", marginBottom: 24 }}>
            <p style={{ fontSize: 11, letterSpacing: 2, color: "#999", margin: "0 0 4px" }}>BENEFICIÁRIO</p>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 18, color: primary, margin: 0 }}>
              {CHURCH.name}
            </p>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: "#eee", margin: "24px 0" }} />

          {/* PIX Key copy */}
          <div>
            <p style={{ fontSize: 12, color: "#999", textTransform: "uppercase", letterSpacing: 1, margin: "0 0 8px" }}>
              Chave PIX (CNPJ)
            </p>
            <div style={{ display: "flex", gap: 8, alignItems: "stretch" }}>
              <div
                style={{
                  flex: 1,
                  padding: "12px 16px",
                  background: "#f5f5f0",
                  borderRadius: 10,
                  fontFamily: "monospace",
                  fontSize: 14,
                  display: "flex",
                  alignItems: "center",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {PIX_KEY}
              </div>
              <button
                onClick={copyPix}
                className="copy-btn"
                style={{
                  padding: "0 18px",
                  border: `2px solid ${primary}`,
                  background: copied ? primary : "transparent",
                  color: copied ? "#fff" : primary,
                  borderRadius: 10,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all .2s",
                }}
              >
                {copied ? "✓ Copiado!" : "Copiar"}
              </button>
            </div>
          </div>

          {/* Info note */}
          <div
            style={{
              marginTop: 24,
              padding: 16,
              background: `${accent}11`,
              borderRadius: 12,
              display: "flex",
              gap: 12,
              alignItems: "flex-start",
            }}
          >
            <span style={{ fontSize: 20 }}>🙏</span>
            <p style={{ margin: 0, fontSize: 13, color: "#555", lineHeight: 1.5 }}>
              Após sua doação, você receberá uma confirmação no WhatsApp ou SMS cadastrado.
            </p>
          </div>
        </div>
      </section>

      {/* ── EVENTS SECTION ─────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", background: "#fff" }}>
        <div className="fade-up-3" style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section Header */}
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <span style={{ fontSize: 12, letterSpacing: 3, color: accent, fontWeight: 600 }}>✦ AGENDA</span>
            <h2
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: "clamp(1.8rem, 4vw, 2.5rem)",
                margin: "12px 0 8px",
                color: primary,
              }}
            >
              Próximos Eventos
            </h2>
            <p style={{ color: "#666", margin: 0 }}>
              Clique em qualquer evento para garantir sua participação.
            </p>
          </div>

          {/* Events Grid */}
          <div style={{ display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {EVENTS.map((event) => (
              <EventCard key={event.id} event={event} accent={accent} primary={primary} />
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer style={{ padding: "48px 24px", textAlign: "center", background: "#fafaf7", borderTop: "1px solid #eee" }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 999,
            background: primary,
            color: "#fff",
            display: "grid",
            placeItems: "center",
            margin: "0 auto 12px",
            fontWeight: 700,
          }}
        >
          {initials(CHURCH.name)}
        </div>
        <p style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: primary, margin: "0 0 8px" }}>
          {CHURCH.name}
        </p>
        <p style={{ fontSize: 12, color: "#999", margin: 0 }}>
          Plataforma gerenciada pela{" "}
          <a
            href="https://ankor.tech"
            target="_blank"
            rel="noopener noreferrer"
            className="donate-link"
            style={{ color: accent, fontWeight: 600, textDecoration: "none" }}
          >
            Ankor Tech
          </a>
        </p>
      </footer>
    </div>
  );
}
