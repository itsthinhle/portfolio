import ContentSection from '@/components/sections/content'
import {aboutMePage} from '@/constants/pages'
import Head from 'next/head'
import Image from 'next/image'
import React from 'react'

export const metadata = {
  title: aboutMePage.metadata.title,
  description: aboutMePage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={aboutMePage.metadata.title} />
      <meta
        property="og:description"
        content={aboutMePage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="About me page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-w flex flex-col md:flex-row gap-x-12 gap-y-16 lg:gap-y-10 items-center'}>
      <div className={'basis-2/5'}>
        <Image
          src="/avatar.jpg"
          width={304}
          height={304}
          priority={true}
          className="profile-image-border-radius mx-auto"
          alt="Screenshots of the dashboard project showing desktop version"
        />
      </div>
      <section className={'basis-3/5'}>
        <h1
          className={'content-section-heading-text text-center md:text-left mb-4'}>
          Thinh Le
        </h1>
        <p className="content-section-sub-heading-text text-center md:text-left mb-8">
          Software engineer & Data scientist
        </p>
        <p
          className={'content-section-normal-text text-gray-600 dark:text-gray-400'}>
          I have 3 years of experience in software development, with a strong focus on
          quality, meeting deadlines, and ensuring client satisfaction. In my free time,
          I enjoy coding or going around capturing moments through photography.
        </p>
      </section>
    </ContentSection>
  </>
}
