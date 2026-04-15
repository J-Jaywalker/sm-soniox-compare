import { cn } from "@/lib/utils";
import React from "react";
import { ResponsiveTooltip } from "./ui/responsive-tooltip";

export const Panel = ({
  title,
  subtitle,
  titleTooltip,
  children,
  muted = false,
  className = "",
  trailingElement,
}: {
  title: string;
  subtitle?: string;
  titleTooltip?: string;
  children: React.ReactNode;
  muted?: boolean;
  className?: string;
  trailingElement?: React.ReactNode;
}) => {
  const titleElement = titleTooltip ? (
    <ResponsiveTooltip
      content={
        <p className="font-mono text-xs whitespace-pre-wrap">{titleTooltip}</p>
      }
    >
      <span className="cursor-default">{title}</span>
    </ResponsiveTooltip>
  ) : (
    title
  );

  return (
    <section
      className={cn(
        "w-full pt-0 flex flex-col",
        muted ? "bg-[#0d1110]" : "bg-[#101211]"
      )}
    >
      <div className="sticky top-0 z-10 border-b border-[#2e3330] py-2.5 bg-[#1d201f]">
        <div className="flex flex-row justify-center px-4 items-center">
          <div className="w-10 flex items-center justify-center" />
          <h2
            className={cn(
              "text-sm md:text-base font-semibold text-center capitalize tracking-tight",
              "text-[#e6edeb]",
              className
            )}
          >
            {titleElement}
          </h2>
          <div className="w-10 flex items-center justify-center">
            {trailingElement}
          </div>
        </div>
        {subtitle && (
          <p className="text-[0.68rem] font-mono text-center text-[#5f6e6a] lowercase mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
      <div className="flex-grow overflow-y-auto relative">{children}</div>
    </section>
  );
};
