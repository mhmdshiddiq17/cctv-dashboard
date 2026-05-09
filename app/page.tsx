import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const theme = {
    "--login-base": "#f4f0e8",
    "--login-ink": "#14211b",
    "--login-ink-muted": "rgba(20, 33, 27, 0.74)",
    "--login-ink-soft": "rgba(20, 33, 27, 0.6)",
    "--login-accent": "#c7432a",
    "--login-forest": "#183a2d",
    "--login-cream": "#fff7ec",
    "--login-cream-soft": "rgba(255, 247, 236, 0.86)",
    "--login-outline": "rgba(20, 33, 27, 0.18)",
    "--login-glow": "rgba(199, 67, 42, 0.2)",
    "--login-mist": "rgba(24, 58, 45, 0.16)",
  } as CSSProperties;

  return (
    <main
      className="min-h-screen bg-[color:var(--login-base)] text-[color:var(--login-ink)]"
      style={theme}
    >
      <div className="relative min-h-screen overflow-hidden">
        <div className="pointer-events-none absolute -left-40 -top-32 h-96 w-96 rounded-full bg-[radial-gradient(circle_at_30%_30%,rgba(199,67,42,0.35),transparent_65%)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-44 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_70%_70%,rgba(24,58,45,0.45),transparent_60%)] blur-3xl" />
        <div className="pointer-events-none absolute left-1/2 top-24 h-40 w-[32rem] -translate-x-1/2 rotate-2 rounded-[999px] bg-[linear-gradient(90deg,rgba(255,255,255,0.6),rgba(255,255,255,0))] opacity-70" />

        <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 py-10 font-sans lg:flex-row lg:items-center lg:justify-between">
          <section className="flex-1 space-y-8 motion-safe:animate-[login-fade_0.7s_ease-out_both]">
            <div className="inline-flex items-center gap-3 rounded-full border border-[color:var(--login-outline)] bg-[color:var(--login-cream)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <Image
                src="/Logo-Koperasi-Merah-Putih.png"
                alt="Logo Koperasi"
                width={14}
                height={14}
                className="h-3.5 w-3.5 object-contain"
                priority
              />
              COMMAND CENTER CCTV KDKMP
            </div>

            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--login-forest)]">
                Monitoring Control Center
              </p>
              <h1 className="text-4xl font-semibold leading-tight text-[color:var(--login-forest)] sm:text-5xl">
                Masuk untuk memantau kondisi CCTV koperasi secara real-time.
              </h1>
              <p className="max-w-xl text-base text-[color:var(--login-ink-muted)]">
                Pantau status kamera, lokasi koperasi, dan indikator layanan dalam satu
                dashboard terpadu tanpa autentikasi dulu. Fokuskan alur kerja kamu terlebih dahulu.
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Status Kamera",
                  desc: "Indikator online, offline, dan latensi server terkini.",
                },
                {
                  title: "Peta Koperasi",
                  desc: "Peta interaktif untuk navigasi cepat antar lokasi.",
                },
                {
                  title: "Rekaman & Audit",
                  desc: "Ringkasan kegiatan dan histori pengawasan.",
                },
                {
                  title: "Tindak Lanjut",
                  desc: "Prioritaskan penanganan kamera bermasalah.",
                },
              ].map((item, index) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-[color:var(--login-outline)] bg-[color:var(--login-cream-soft)] p-4 shadow-[0_18px_40px_-30px_rgba(0,0,0,0.35)] motion-safe:animate-[login-rise_0.7s_ease-out_both]"
                  style={{ animationDelay: `${index * 90 + 120}ms` }}
                >
                  <p className="text-sm font-semibold text-[color:var(--login-forest)]">
                    {item.title}
                  </p>
                  <p className="mt-2 text-xs text-[color:var(--login-ink-soft)]">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <section className="w-full max-w-md">
            <div className="rounded-3xl border border-[color:var(--login-outline)] bg-[color:var(--login-cream)] p-8 shadow-[0_30px_80px_-40px_rgba(20,33,27,0.65)] motion-safe:animate-[login-fade_0.8s_ease-out_both]">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-semibold text-[color:var(--login-forest)]">
                    Login Dashboard
                  </h2>
                  <p className="mt-1 text-sm text-[color:var(--login-ink-soft)]">
                    Masuk sebagai operator monitoring.
                  </p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[color:var(--login-outline)] bg-white/90 shadow-[0_12px_28px_-12px_var(--login-glow)]">
                  <Image
                    src="/Logo-Koperasi-Merah-Putih.png"
                    alt="Logo Koperasi"
                    width={28}
                    height={28}
                    className="h-7 w-7 object-contain"
                    priority
                  />
                </div>
              </div>

              <div className="mt-8 space-y-5">
                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--login-forest)]">
                  Email
                  <input
                    type="email"
                    placeholder="nama@koperasi.id"
                    className="mt-2 w-full rounded-xl border border-[color:var(--login-outline)] bg-white/80 px-4 py-3 text-sm text-[color:var(--login-ink)] shadow-[0_10px_20px_-16px_rgba(0,0,0,0.35)] focus:border-[color:var(--login-accent)] focus:outline-none"
                  />
                </label>

                <label className="block text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--login-forest)]">
                  Password
                  <input
                    type="password"
                    placeholder="********"
                    className="mt-2 w-full rounded-xl border border-[color:var(--login-outline)] bg-white/80 px-4 py-3 text-sm text-[color:var(--login-ink)] shadow-[0_10px_20px_-16px_rgba(0,0,0,0.35)] focus:border-[color:var(--login-accent)] focus:outline-none"
                  />
                </label>

                <div className="flex items-center justify-between text-xs text-[color:var(--login-ink-soft)]">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[color:var(--login-outline)] accent-[color:var(--login-accent)]"
                    />
                    Ingat perangkat ini
                  </label>
                  <span className="font-semibold text-[color:var(--login-forest)]">
                    Bantuan akses
                  </span>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                <Link
                  href="/dashboard"
                  className="flex w-full items-center justify-center rounded-xl bg-[color:var(--login-accent)] px-4 py-3 text-sm font-semibold text-white shadow-[0_20px_40px_-22px_var(--login-glow)] transition hover:-translate-y-0.5"
                >
                  Login dan Masuk Dashboard
                </Link>
                <div className="rounded-xl border border-dashed border-[color:var(--login-outline)] px-4 py-3 text-xs text-[color:var(--login-ink-soft)]">
                  Ini masih mockup UI, klik tombol login untuk langsung masuk ke dashboard.
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
