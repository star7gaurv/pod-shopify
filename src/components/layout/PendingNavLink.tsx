"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition, type MouseEvent, type ReactNode } from "react";

type PendingNavLinkProps = {
  href: string;
  className: string;
  pendingClassName?: string;
  children: ReactNode;
  disabled?: boolean;
};

export function PendingNavLink({
  href,
  className,
  pendingClassName = "pointer-events-none opacity-70",
  children,
  disabled = false,
}: PendingNavLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isLocked, setIsLocked] = useState(false);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (disabled || isPending || isLocked) {
      event.preventDefault();
      return;
    }

    event.preventDefault();
    setIsLocked(true);
    startTransition(() => {
      router.push(href);
    });
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-disabled={disabled || isPending || isLocked}
      className={[
        className,
        disabled || isPending || isLocked ? pendingClassName : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </Link>
  );
}
