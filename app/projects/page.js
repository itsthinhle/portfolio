import Projects from '@/components/pages/projects/projects'
import ContentSection from '@/components/sections/content'
import ProjectsSkeleton from '@/components/skeletons/pages/projects/projects'
import ContentSectionHeadingText from '@/components/texts/headings/content-section'
import ContentSectionSubHeadingText from '@/components/texts/sub-headings/content-section'
import Head from 'next/head'
import React, {Suspense} from 'react'

const pageTitle = 'My projects | Thinh writes bugs'
const pageDescription = 'A wide range of projects reflects my studies and personal interests.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Projects page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <ContentSection className={'container-layout'}>
      <section className={'text-center'}>
        <ContentSectionHeadingText className={'mb-4'}>
          Projects
        </ContentSectionHeadingText>
        <ContentSectionSubHeadingText>
          A wide range of projects reflects my studies and personal interests.
        </ContentSectionSubHeadingText>
      </section>
      <Suspense fallback={<ProjectsSkeleton />}>
        <Projects />
      </Suspense>
    </ContentSection>
  </>
}
