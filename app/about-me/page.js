import IntroductionSection from '@/components/pages/about-me/introduction-section'
import {aboutMePage} from '@/constants/pages'
import Head from 'next/head'

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
    <IntroductionSection />
  </>
}
