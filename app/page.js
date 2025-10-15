import HeroSection from '@/components/sections/hero'
import {homePage, projectsPage} from '@/constants/pages'
import {ArrowRight02Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'

export const metadata = {
  title: homePage.metadata.title,
  description: homePage.metadata.description
}

export default function HomePage() {
  return <>
    <Head>
      <meta property="og:title" content={homePage.metadata.title} />
      <meta
        property="og:description"
        content={homePage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Homepage" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <HeroSection className={'container-w text-center'}>
      <h1
        className={'hero-section-heading-text mb-8 lg:mb-10'}>
        From curiosity<br />to reality
      </h1>
      <p className={'hero-section-sub-heading-text mb-10'}>
        &ldquo;A creative mind builds not just for answers,<br />but to explore
        and to share what it discovers.&rdquo;
      </p>
      <div className={'flex justify-center'}>
        <Link
          className={clsx([
            'flex items-center gap-2 w-fit whitespace-nowrap font-semibold leading-6',
            'hover:text-light-accent dark:hover:text-dark-accent'
          ])}
          aria-label={'View my projects'}
          href={projectsPage.path}
          prefetch={true}>
          <p>View my projects</p>
          <HugeiconsIcon icon={ArrowRight02Icon} />
        </Link>
      </div>
    </HeroSection>
  </>
}
