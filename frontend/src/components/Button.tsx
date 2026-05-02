import { ButtonHTMLAttributes, ElementType, ComponentPropsWithoutRef } from "react";
import clsx from "clsx";

type ButtonBaseProps = {
  variant?: "primary" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
};

type ButtonAsButton = ButtonBaseProps &
  ButtonHTMLAttributes<HTMLButtonElement> & { as?: "button" };

type ButtonAsLink = ButtonBaseProps &
  ComponentPropsWithoutRef<"a"> & { as: ElementType };

type ButtonProps = ButtonAsButton | ButtonAsLink;

export default function Button({
  variant = "primary",
  size = "md",
  className,
  children,
  as: Tag = "button",
  ...props
}: ButtonProps & { as?: ElementType }) {
  return (
    <Tag
      className={clsx(
        "inline-flex items-center justify-center font-medium rounded-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50",
        {
          "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-md active:scale-[0.98]":
            variant === "primary",
          "border border-brand-500 text-brand-500 hover:bg-brand-50 hover:shadow-sm active:scale-[0.98]":
            variant === "outline",
          "text-brand-500 hover:bg-brand-50": variant === "ghost",
          "px-3 py-1.5 text-sm": size === "sm",
          "px-4 py-2 text-sm": size === "md",
          "px-8 py-3.5 text-base tracking-wide": size === "lg",
        },
        className
      )}
      {...props}
    >
      {children}
    </Tag>
  );
}
