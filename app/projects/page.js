import {projectsPage} from '@/constants/pages'
import Head from 'next/head'

export const metadata = {
  title: projectsPage.metadata.title,
  description: projectsPage.metadata.title
}

export default function Home() {
  return <>
    <Head>
      <meta property="og:title" content={projectsPage.metadata.title} />
      <meta
        property="og:description"
        content={projectsPage.metadata.description}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Projects page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
  </>
}
