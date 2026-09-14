import type { ComponentProps } from "react";
import "./select.css";

/** Native behavior, labels and refs; one shared dropdown affordance. */
export function Select({ className, ...props }: ComponentProps<"select">) {
  return (
    <select
      {...props}
      className={className ? `hen-select ${className}` : "hen-select"}
    />
  );
}
