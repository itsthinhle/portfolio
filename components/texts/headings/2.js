import React from 'react'

export default function Heading2({
  className, children
}) {
  return <h2 className={`${className} mt-16 mb-6 text-3xl lg:text-4xl font-semibold tracking-tight text-pretty`}>
    {children}
  </h2>
}
