import TextLink from '@/components/links/text'
import HeroSection from '@/components/sections/hero'
import HeroSectionHeadingText from '@/components/texts/headings/hero-section'
import NormalText from '@/components/texts/normal'
import {projects} from '@/constants/navigation-items'
import {ArrowRight02Icon} from '@hugeicons-pro/core-solid-standard'
import {HugeiconsIcon} from '@hugeicons/react'
import Head from 'next/head'
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
    <HeroSection className={'container-layout text-center'}>
      <HeroSectionHeadingText className={'mb-8'}>
        From curiosity<br />to reality
      </HeroSectionHeadingText>
      <NormalText className={'mb-10 text-lg sm:text-xl lg:text-2xl leading-8 font-medium text-pretty'}>
        &ldquo;A creative mind builds not just for answers,<br />but to
        explore and to share what it discovers.&rdquo;
      </NormalText>
      <div className={'flex justify-center'}>
        <TextLink
          ariaLabel={'View my projects link'}
          className={'flex items-center gap-2 w-fit whitespace-nowrap'}
          href={projects.path}>
          <p>View my projects</p>
          <HugeiconsIcon icon={ArrowRight02Icon} />
        </TextLink>
      </div>
    </HeroSection>
  </>
}
