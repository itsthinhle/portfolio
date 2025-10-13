import IntroductionSection from '@/components/pages/about-me/introduction-section'
import Head from 'next/head'

export const metadata = {
  title: 'About me | Thinh writes bugs',
  description: 'A short introduction about me'
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content="About me | Thinh writes bugs" />
      <meta
        property="og:description"
        content="A short introduction about me"
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
      <meta name="twitter:image" content="<generated>" />
      <meta name="twitter:image:type" content="<generated>" />
      <meta name="twitter:image:width" content="<generated>" />
      <meta name="twitter:image:height" content="<generated>" />
    </Head>

    <IntroductionSection />
  </>
}
