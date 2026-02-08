import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

/* Use as button link but display as text only */
export default function TextLink({
  className, ariaLabel, href, children, prefetch = false
}) {
  return <Link
    className={clsx([
      className,
      'leading-6 font-semibold hover:text-light-accent dark:hover:text-dark-accent'
    ])}
    aria-label={ariaLabel}
    href={href}
    prefetch={prefetch}>
    {children}
  </Link>
}
