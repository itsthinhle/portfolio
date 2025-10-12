import PrimaryButton from '@/components/buttons/primary'
import {projectsPage} from '@/constants/pages'
import {SourceCodeIcon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import Link from 'next/link'
import React from 'react'


export default function HeroSection() {
  return <section>
    <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8 py-32 sm:py-48 lg:py-56">
      <section className={'text-center'}>
        <h1
          className={'text-5xl sm:text-8xl font-semibold tracking-tight text-balance mb-8'}>
          From curiosity<br />to reality
        </h1>
        <p className={clsx([
          'text-lg sm:text-2xl/8 font-medium text-pretty text-gray-500 dark:text-gray-400 mb-10'
        ])}>
          &ldquo;A creative mind builds not just for answers,<br />but to explore
          and to share what it discovers.&rdquo;
        </p>
        <div className={'flex justify-center'}>
          <Link
            aria-label={'View my projects'}
            href={projectsPage.path}
            prefetch={true}>
            <PrimaryButton
              aria-label="View my projects"
              className={'flex items-center gap-2 w-fit whitespace-nowrap'}>
              <HugeiconsIcon icon={SourceCodeIcon} />
              <p>View my projects</p>
            </PrimaryButton>
          </Link>
        </div>
      </section>
    </div> 
  </section>
}
