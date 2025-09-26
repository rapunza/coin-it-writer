import * as React from "react";

export function Avatar({ className = "", children }: { className?: string; children?: React.ReactNode }) {
  return (
    <span className={`inline-block rounded-full bg-gray-200 overflow-hidden ${className}`}>{children}</span>
  );
}

export function AvatarImage({ src, alt }: { src: string; alt?: string }) {
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

export function AvatarFallback({ children }: { children?: React.ReactNode }) {
  return <span className="flex items-center justify-center w-full h-full text-gray-500">{children}</span>;
}
