'use client';

import { BadgeCheck, ScanSearch, ShieldAlert, Sparkles } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";

type FeatureKey = "verification" | "image" | "scam" | "semantic";

const featureOrder: { id: FeatureKey; icon: ReactNode }[] = [
  { id: "verification", icon: <BadgeCheck className="size-10" strokeWidth={1.5} /> },
  { id: "image", icon: <ScanSearch className="size-10" strokeWidth={1.5} /> },
  { id: "scam", icon: <ShieldAlert className="size-10" strokeWidth={1.5} /> },
  { id: "semantic", icon: <Sparkles className="size-10" strokeWidth={1.5} /> },
];

interface Feature76Props {
  className?: string;
}

const Feature76 = ({ className }: Feature76Props) => {
  const t = useTranslations("marketplace.ai");

  return (
    <section className={cn("relative pt-10 pb-8 md:pt-14", className)}>
      <div className="relative z-10 container flex flex-col space-y-10">
        <div className="flex flex-col px-6 lg:px-10">
          <div className="mb-6 inline-flex w-fit items-center gap-2 rounded-full border border-foreground/10 bg-foreground/[0.03] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-foreground/60">
            <span className="relative flex h-1.5 w-1.5" aria-hidden>
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e30613] opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#e30613]" />
            </span>
            {t("eyebrow")}
          </div>
          <h2 className="mb-3 text-3xl font-semibold md:text-5xl lg:max-w-md">
            {t("headline")}
          </h2>
          <p className="max-w-xl text-[15px] leading-relaxed text-foreground/75">
            {t("subline")}
          </p>
        </div>
        <div className="relative mt-2 md:mt-4">
          <div className="absolute top-0 right-0 left-0 h-px bg-border" />
          <div className="grid divide-border md:grid-cols-4 md:divide-x">
            {featureOrder.map((feature) => (
              <div
                key={feature.id}
                className="relative px-6 pb-10 md:pb-6 lg:px-10"
              >
                <div className="absolute top-0 right-0 left-0 h-px bg-border md:hidden" />
                <div className="relative -mt-6 mb-6 flex aspect-square w-12 items-center justify-center bg-background md:-mt-10 md:mb-8 md:w-20">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="mb-2 max-w-[12rem] text-lg font-semibold md:mb-3 md:text-2xl lg:mb-4">
                    {t(`features.${feature.id}.title`)}
                  </h3>
                  <p className="text-muted-foreground">
                    {t(`features.${feature.id}.desc`)}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute right-0 bottom-0 left-0 h-px bg-border" />
        </div>
        <p className="px-6 text-[11px] leading-loose text-foreground/55 lg:px-10">
          {t("reassurance")}
        </p>
      </div>
      <div className="absolute inset-0 container hidden h-full md:block">
        <div className="relative h-full">
          <div className="absolute inset-y-0 left-0 h-full w-px bg-border"></div>
          <div className="absolute inset-y-0 right-0 h-full w-px bg-border"></div>
        </div>
      </div>
    </section>
  );
};

export { Feature76 };
