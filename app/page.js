import HeroSection from '@/components/sections/hero'
import {projects} from '@/constants/navigation-items'
import {ArrowRight02Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import clsx from 'clsx'
import Head from 'next/head'
import Link from 'next/link'
import React from 'react'

const pageTitle = 'Home | Thinh writes bugs'
const pageDescription = 'Welcome to my portfolio! Grab a coffee and take a look at what I’ve been building and breaking lately.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default function HomePage() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Homepage" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <HeroSection className={'container-w text-center'}>
      <h1 className={'hero-section-heading-text mb-8 lg:mb-10'}>
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
          href={projects.path}
          prefetch={true}>
          <p>View my projects</p>
          <HugeiconsIcon icon={ArrowRight02Icon} />
        </Link>
      </div>
    </HeroSection>
  </>
}
