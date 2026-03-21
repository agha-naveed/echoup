"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

type NavItemProps = {
  href: string;
  title: string;
  icon: React.ReactNode;
  exact?: boolean;
};

export default function NavItem({
  href,
  title,
  icon,
  exact = true,
}: NavItemProps) {
  const pathname = usePathname();

  const isActive = exact
    ? pathname === href
    : pathname.startsWith(href);

  return (
    <Link
      href={href}
      title={title}
      aria-current={isActive ? "page" : undefined}
      className={clsx(
        "block p-3 rounded-full transition-all",
        "hover:bg-dark-clr",
        isActive
          ? "text-main-blue menu-shadow"
          : "text-foreground"
      )}
    >
      {icon}
    </Link>
  );
}
