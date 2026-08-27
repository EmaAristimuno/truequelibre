"use client";

import { useFormStatus } from "react-dom";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface SubmitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  pendingText?: ReactNode;
}

// Un <button type="submit"> plano no se deshabilita solo mientras la server
// action está en vuelo: con conexiones lentas (ej. subiendo fotos), un
// doble click alcanza a disparar la acción dos veces antes del redirect
// (duplicaba publicaciones). useFormStatus detecta el estado del <form>
// ancestro sin necesidad de que el form en sí sea un client component.
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending || disabled} {...props}>
      {pending ? (pendingText ?? children) : children}
    </button>
  );
}
