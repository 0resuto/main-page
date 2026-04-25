"use client";

import { AnchorHTMLAttributes } from "react";

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function AnchorLink({ href, onClick, children, ...props }: AnchorLinkProps) {
  return (
    <a href={href} onClick={onClick} {...props}>
      {children}
    </a>
  );
}
