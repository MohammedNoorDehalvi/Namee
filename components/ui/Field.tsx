'use client';

import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const controlBase =
  'w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3.5 text-sm font-medium text-white placeholder:text-slate-400 outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60';

const selectBase =
  'w-full appearance-none rounded-2xl border border-white/15 bg-slate-950/80 px-4 py-3.5 text-sm font-medium text-white outline-none transition focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/40 disabled:opacity-60';

type FieldShellProps = {
  label: string;
  htmlFor?: string;
  hint?: string;
  error?: string;
  className?: string;
  children: ReactNode;
};

export function Field({ label, htmlFor, hint, error, className, children }: FieldShellProps) {
  return (
    <div className={cn('block space-y-2', className)}>
      <label htmlFor={htmlFor} className="block text-xs font-bold uppercase tracking-wider text-slate-300">
        {label}
      </label>
      {children}
      {error ? (
        <p className="text-xs font-semibold normal-case tracking-normal text-red-300" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs font-medium normal-case tracking-normal text-slate-500">{hint}</p>
      ) : null}
    </div>
  );
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export function TextField({ label, hint, error, id, className, containerClassName, ...props }: InputProps) {
  const inputId = id || props.name;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} className={containerClassName}>
      <input
        id={inputId}
        className={cn(controlBase, error && 'border-red-400/40 focus:ring-red-400/30', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
};

export function SelectField({ label, hint, error, id, className, containerClassName, children, ...props }: SelectProps) {
  const inputId = id || props.name;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error} className={containerClassName}>
      <select
        id={inputId}
        className={cn(selectBase, error && 'border-red-400/40 focus:ring-red-400/30', className)}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
    </Field>
  );
}

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  hint?: string;
  error?: string;
};

export function TextareaField({ label, hint, error, id, className, ...props }: TextareaProps) {
  const inputId = id || props.name;
  return (
    <Field label={label} htmlFor={inputId} hint={hint} error={error}>
      <textarea
        id={inputId}
        className={cn(controlBase, 'min-h-[100px] resize-y', error && 'border-red-400/40', className)}
        aria-invalid={Boolean(error)}
        {...props}
      />
    </Field>
  );
}

export { controlBase as fieldControlClass, selectBase as fieldSelectClass };
