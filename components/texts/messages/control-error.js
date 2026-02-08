import clsx from 'clsx'
import React from 'react'

export default function ControlErrorMessageText({
  children, className
}) {
  return <p className={clsx(
    'text-sm lg:text-base text-light-error dark:text-dark-error',
    className
  )}>
    {children}
  </p>
}
