
"use client";
import Link, { LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

interface ActiveLinkProps extends LinkProps {
  children: ReactNode;
  activeClassName?: string;
}

const ActiveLink = ({ href, children, ...props }: ActiveLinkProps) => {
  const pathname = usePathname();

  const isActive =
    href === "/" ? pathname === href : pathname.startsWith(href as string);

  return (
    <Link
      href={href}
      {...props}
      className={`nav-link d-flex align-items-center gap-1
         p-2 rounded-end-1 hover:tw-bg-gray-600 transition-colors duration-200 ${
           isActive ? "bg-warning fw-semibold " : "tw-text-gray-500"
         }`}
    >
      {children}
    </Link>
  );
};

export default ActiveLink;
