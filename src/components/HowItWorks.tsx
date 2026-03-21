import { useLang } from "@/contexts/LanguageContext";
import { Search, Clock, CheckCircle } from "lucide-react";

export default function HowItWorks() {
  const { t } = useLang();

  const steps = [
    { icon: Search, title: t.howItWorks.step1, desc: t.howItWorks.step1desc, num: "01" },
    { icon: Clock, title: t.howItWorks.step2, desc: t.howItWorks.step2desc, num: "02" },
    { icon: CheckCircle, title: t.howItWorks.step3, desc: t.howItWorks.step3desc, num: "03" },
  ];

  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <h2 className="mx-auto max-w-2xl text-center font-display text-3xl font-bold md:text-4xl text-balance">
          {t.howItWorks.title}
        </h2>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {steps.map((step, i) => (
            <div key={i} className="relative text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary">
                <step.icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <span className="mt-4 block font-display text-xs font-bold tracking-widest text-muted-foreground uppercase">
                {step.num}
              </span>
              <h3 className="mt-2 font-display text-lg font-semibold">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-muted-foreground text-pretty">
                {step.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
