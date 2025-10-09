import * as React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ src, alt, className }: { src?: string; alt?: string; className?: string }) {
  return (
    <div className={cn("h-12 w-12 overflow-hidden rounded-full bg-gray-200", className)}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <div className="h-full w-full grid place-items-center text-gray-500">👤</div>
      )}
    </div>
  );
}
