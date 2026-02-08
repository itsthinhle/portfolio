import clsx from 'clsx'
import React from 'react'

export default function Modal({
  children,
  className,
  onPointerDown = (_event) => _event.stopPropagation(),
  ref
}) {
  // Or a custom loading skeleton component
  return <div
    ref={ref}
    onPointerDown={onPointerDown}
    className={clsx(
      'rounded-lg bg-light dark:bg-dark px-4 pt-5 pb-4 sm:p-6',
      'shadow-xl shadow-dark/25 dark:shadow-light/25',
      className)}>
    {children}
  </div>
}