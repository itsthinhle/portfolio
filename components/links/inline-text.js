import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'

export default function InlineTextLink({
  className, ariaLabel, href, target = 'undefined', children, prefetch = false
}) {
  return <Link
    target={target}
    className={clsx([
      className,
      'font-semibold text-light-link dark:text-dark-link hover:underline',
    ])}
    aria-label={ariaLabel}
    href={href}
    prefetch={prefetch}>
    {children}
  </Link>
}
