import {contactMePage} from '@/constants/pages'
import Head from 'next/head'

export const metadata = {
  title: contactMePage.metadata.title,
  description: contactMePage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={contactMePage.metadata.title} />
      <meta
        property="og:description"
        content={contactMePage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Contact me page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
  </>
}
