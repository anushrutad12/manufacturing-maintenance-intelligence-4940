import React from "react";

/**
 * PUBLIC_INTERFACE
 * @param {{ variant?: "default"|"primary"|"amber", children: any } & React.ButtonHTMLAttributes<HTMLButtonElement>} props
 */
export function Button({ variant = "default", children, className = "", ...rest }) {
  const v =
    variant === "primary" ? "btn btnPrimary" : variant === "amber" ? "btn btnAmber" : "btn";
  return (
    <button className={`${v} ${className}`.trim()} {...rest}>
      {children}
    </button>
  );
}
