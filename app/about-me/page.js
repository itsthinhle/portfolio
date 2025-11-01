import ContentSection from '@/components/sections/content'
import ContentSectionHeadingText from '@/components/texts/headings/content-section'
import ContentSectionNormalText from '@/components/texts/normal/content-section'
import ContentSectionSubHeadingText from '@/components/texts/sub-headings/content-section'
import Head from 'next/head'
import Image from 'next/image'
import React from 'react'

const pageTitle = 'About me | Thinh writes bugs'
const pageDescription = 'A short introduction about me.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default function AboutMePage() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="About me page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-layout flex flex-col md:flex-row gap-x-12 gap-y-16 lg:gap-y-10 items-center'}>
      <div className={'basis-2/5'}>
        <Image
          src="/avatar.jpg"
          width={320}
          height={320}
          priority={true}
          className="profile-image-border-radius mx-auto"
          alt="Screenshots of the dashboard project showing desktop version"
        />
      </div>
      <section className={'basis-3/5'}>
        <ContentSectionHeadingText className={'text-center md:text-left mb-4'}>
          Tat Thinh Le
        </ContentSectionHeadingText>
        <ContentSectionSubHeadingText className={'text-center md:text-left mb-8'}>
          Software engineer & Data scientist
        </ContentSectionSubHeadingText>
        <ContentSectionNormalText>
          I have 3 years of experience in software development, with a strong focus on
          quality, meeting deadlines, and ensuring client satisfaction. In my free time,
          I enjoy coding or going around capturing moments through photography.
        </ContentSectionNormalText>
      </section>
    </ContentSection>
  </>
}
