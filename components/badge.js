import clsx from 'clsx'
import React from 'react'

export default function Badge({
  children,
  className
}) {
  // Or a custom loading skeleton component
  return <span
    className={clsx(
      'font-medium px-2 py-1 rounded-md text-xs lg:text-sm',
      'bg-gray-100 dark:bg-gray-800/75',
      'text-gray-600 dark:text-gray-400',
      className
    )}>
    {children}
  </span>
}

