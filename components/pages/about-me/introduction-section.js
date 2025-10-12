import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import Image from 'next/image'
import React from 'react'

// Used template in Content Sections in Tailwind
export default function IntroductionSection() {
  console.log('IntroductionSection')
  return <div>
    <div className={clsx([
      'container-layout py-24 sm:py-32',
      'flex flex-col md:flex-row gap-x-12 gap-y-16 lg:gap-y-10 items-center'
    ])}>
      <div className={'basis-2/5'}>
        <Image
          src="/avatar.jpg"
          width={352}
          height={352}
          priority={true}
          className="profile-image-border-radius mx-auto"
          alt="Screenshots of the dashboard project showing desktop version"
        />
      </div>
      <section className={'basis-3/5'}>
        <h1
          className={'text-4xl sm:text-6xl font-semibold tracking-tight text-pretty mb-6'}>
          Tat Thinh Le
        </h1>
        <p className="leading-8 text-2xl text-gray-700 dark:text-gray-300 mb-8">
          Software engineer & Data scientist
        </p>
        <p
          className={'leading-7 text-gray-600 dark:text-gray-400'}>
          I have 3 years of experience in software development, with a strong focus on quality, meeting deadlines,
          and ensuring client satisfaction. With a major in Information Systems, I am currently pursuing a master’s
          program in Data Science and Analytics at Stockton University. In my free time, I enjoy coding or going
          around capturing moments through photography.
        </p>
      </section>

    </div>
  </div>
}
