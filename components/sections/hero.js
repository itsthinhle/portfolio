import React from 'react'

export default function HeroSection({
  children, className
}) {
  return <section className={`page-px py-32 sm:py-48 lg:py-56 ${className}`}>
    {children}
  </section>
}