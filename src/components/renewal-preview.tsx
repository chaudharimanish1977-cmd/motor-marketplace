import { CalendarClock, Bell, Mail, MessageSquare, ShieldCheck } from "lucide-react";

/**
 * Renewal-calendar teaser shown on the home page. Communicates the renewal
 * flywheel: once you've reviewed a policy with us, we automatically remind
 * you at the right times next year — so you never auto-renew without
 * comparing offers.
 */
export function RenewalPreview() {
  const milestones: {
    label: string;
    sub: string;
    icon: typeof Bell;
    accent: string;
    bg: string;
    bar: string;
  }[] = [
    {
      label: "T-60 days",
      sub: "Email nudge",
      icon: Mail,
      accent: "text-brand-navy",
      bg: "bg-blue-50",
      bar: "bg-brand-navy/30",
    },
    {
      label: "T-30 days",
      sub: "Pre-quote SMS",
      icon: MessageSquare,
      accent: "text-brand-navy",
      bg: "bg-sky-50",
      bar: "bg-brand-navy/40",
    },
    {
      label: "T-7 days",
      sub: "Action reminder",
      icon: Bell,
      accent: "text-brand-coral",
      bg: "bg-orange-50",
      bar: "bg-brand-olive/40",
    },
    {
      label: "Renewal day",
      sub: "Policy issued",
      icon: ShieldCheck,
      accent: "text-brand-success",
      bg: "bg-emerald-50",
      bar: "bg-brand-success/40",
    },
  ];

  return (
    <section className="mt-24 max-w-5xl w-full">
      <div className="rounded-3xl bg-gradient-to-br from-white to-brand-offwhite border border-brand-light-gray shadow-soft overflow-hidden">
        <div className="px-6 md:px-8 py-7 grid md:grid-cols-[1fr_2fr] gap-6 items-center">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-navy bg-blue-50 border border-blue-100 rounded-full mb-3">
              <CalendarClock className="w-3.5 h-3.5" />
              Renewal Calendar
            </div>
            <h3 className="text-2xl font-bold text-brand-charcoal leading-tight">
              Reviewed once.
              <br />
              <span className="bg-gradient-to-r from-brand-navy to-brand-plum bg-clip-text text-transparent">
                Watched forever.
              </span>
            </h3>
            <p className="text-sm text-brand-slate mt-2 leading-relaxed">
              We schedule reminders at the right intervals so you never
              auto-renew without comparing offers again.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-brand-navy via-brand-coral to-brand-success rounded-full" />
            <div className="relative grid grid-cols-4 gap-2">
              {milestones.map((m) => {
                const Icon = m.icon;
                return (
                  <div
                    key={m.label}
                    className="flex flex-col items-center text-center"
                  >
                    <div
                      className={`w-10 h-10 rounded-full ${m.bg} flex items-center justify-center shadow-soft border-2 border-white relative z-10`}
                    >
                      <Icon className={`w-5 h-5 ${m.accent}`} />
                    </div>
                    <div className="text-[10px] font-bold text-brand-charcoal mt-2 tracking-tight">
                      {m.label}
                    </div>
                    <div className="text-[10px] text-brand-slate leading-tight">
                      {m.sub}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
