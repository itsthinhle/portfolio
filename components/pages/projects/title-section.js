import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

// Used template in Blog Sections in Tailwind
export default function TitleSection() {
  return <section
    className={'container-layout pb-10 sm:pb-16 border-b border-gray-200 dark:border-gray-700 text-center'}>
    <h1
      className={'text-4xl sm:text-6xl font-semibold tracking-tight text-pretty mb-2'}>
      Projects
    </h1>
    <p className="leading-8 text-xl text-gray-600 dark:text-gray-300">
      A wide range of projects reflects my studies and personal interests.
    </p>
  </section>
}
