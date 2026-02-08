import clsx from 'clsx'
import React from 'react'

export default function Heading2({
  className, children
}) {
  return <h2 className={clsx(
    'text-3xl lg:text-4xl font-semibold tracking-tight text-pretty',
    className)}>
    {children}
  </h2>
}
