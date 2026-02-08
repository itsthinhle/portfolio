import React from 'react'

export default function NormalText({
  className,
  children
}) {
  return <p className={`text-light-normal-text dark:text-dark-normal-text ${className}`}>
    {children}
  </p>
}
