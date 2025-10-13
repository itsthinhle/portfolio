import HeroSection from '@/components/pages/home/hero-section'
import {homePage} from '@/constants/pages'
import Head from 'next/head'

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
    <HeroSection />
  </>
}
