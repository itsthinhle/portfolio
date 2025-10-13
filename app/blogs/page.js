import IntroductionSection from '@/components/pages/about-me/introduction-section'
import {blogsPage} from '@/constants/pages'
import Head from 'next/head'

export const metadata = {
  title: blogsPage.metadata.title,
  description: blogsPage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={blogsPage.metadata.title} />
      <meta
        property="og:description"
        content={blogsPage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Blogs page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <IntroductionSection />
  </>
}
