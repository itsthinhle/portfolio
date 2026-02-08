import clsx from 'clsx'
import React from 'react'

export default function ControlLabelText({
  className, children, htmlFor,
  isBold = true
}) {
  return <label
    htmlFor={htmlFor}
    className={clsx(
      `block leading-6 text-sm lg:text-base ${className}`,
      {'font-medium': isBold})
    }>
    {children}
  </label>
}
