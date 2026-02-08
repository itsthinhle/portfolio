import React from 'react'

export default function ModalHeadingText({
  children, className
}) {
  return <h3 className={`text-base lg:text-lg font-semibold ${className}`}>
    {children}
  </h3>
}
