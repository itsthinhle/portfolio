import React from 'react'

export default function ContentSection({
  children, className
}) {
  return <section className={`page-px py-24 sm:py-32 ${className}`}>
    {children}
  </section>
}