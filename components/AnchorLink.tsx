"use client";

import { AnchorHTMLAttributes, MouseEvent } from "react";

interface AnchorLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
}

export default function AnchorLink({ href, onClick, children, ...props }: AnchorLinkProps) {
  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith("#")) {
      e.preventDefault();
      const targetId = href.substring(1);
      const element = document.getElementById(targetId);
      
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
        if (href === "#about") {
          window.history.pushState(null, "", window.location.pathname);
        } else {
          window.history.pushState(null, "", href);
        }
      }
    }
    if (onClick) onClick(e);
  };

  return (
    <a href={href} onClick={handleClick} {...props}>
      {children}
    </a>
  );
}