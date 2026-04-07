import IpaSymbol from '@/app/blogs/english-pronunciation/components/ipa-symbol'
import {
  consonants,
  diphthongs,
  monophthongs
} from '@/app/blogs/english-pronunciation/constants/ipa-symbols'
import propertyTypeConstant from '@/app/projects/sale-and-rental-listings/constants/property-type'
import BlogPostLayout from '@/components/layouts/blog-post'
import Heading2 from '@/components/texts/headings/2'
import NormalText from '@/components/texts/normal'
import clsx from 'clsx'
import Head from 'next/head'
import React from 'react'

const pageTitle = 'Blog: English Pronunciation'
const pageDescription = 'My notes of learning speaking American English.'

export const metadata = {
  title: pageTitle,
  description: pageDescription
}

export default async function EnglishPronunciationPage() {
  return <>
    <Head>
      <meta property="og:title" content={pageTitle} />
      <meta
        property="og:description"
        content={pageDescription}
      />
      <meta property="og:image" content="<generated>" />
      <meta property="og:image:alt" content="Index page" />
      <meta property="og:image:type" content="<generated>" />
      <meta property="og:image:width" content="<generated>" />
      <meta property="og:image:height" content="<generated>" />
    </Head>
    <BlogPostLayout
      creation_date={'2026-03-29'}
      title={'English Pronunciation'}>
      <section className={'container-layout'}>
        <Heading2 className={'heading-2-my'}>Phonemic Chart</Heading2>
        <div className={'text-center mb-8'}>
          <div className={'inline-flex flex-col gap-2'}>
            {/* Vowels */}
            <div className={clsx(
              'inline-flex gap-2',
            )}>
              <div
                className={clsx(
                  'self-stretch flex',
                  'px-3.5 py-3 border border-light-boundary dark:border-dark-boundary'
                )}>
                {/* Make the text vertical and read from bottom to top */}
                <p className={'[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-medium'}>Vowels</p>
              </div>

              <div className={'flex flex-col gap-2 lg:flex-row items-start'}>
                {/* Monophthongs */}
                <div className={clsx(
                  'grid grid-cols-4 gap-2',
                )}>
                  <p className={clsx(
                    'col-span-4 font-medium',
                    'py-3.5 px-3 border border-light-boundary dark:border-dark-boundary'
                  )}>
                    Monophthongs
                  </p>
                  {monophthongs.map((_monophthong, _monophthongIndex) => (
                    <IpaSymbol
                      key={_monophthongIndex}
                      symbol={_monophthong.symbol}
                      representativeWordElement={_monophthong.representativeWordElement}
                      containerClassName={clsx(
                        _monophthong.containerClassName
                      )}
                    />
                  ))}
                </div>

                {/* Diphthongs */}
                <div className={clsx(
                  'grid grid-cols-4 gap-2',
                )}>
                  <p className={clsx(
                    'col-span-4 font-medium',
                    'py-3.5 px-3 border border-light-boundary dark:border-dark-boundary'
                  )}>
                    Diphthongs
                  </p>
                  {diphthongs.map((_diphthong, _diphthongIndex) => (
                    <IpaSymbol
                      key={_diphthongIndex}
                      symbol={_diphthong.symbol}
                      representativeWordElement={_diphthong.representativeWordElement}
                      containerClassName={clsx(
                        _diphthong.containerClassName
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Consonants */}
            <div className={clsx(
              'inline-flex gap-2',
            )}>
              <div
                className={clsx(
                  'self-stretch flex',
                  'px-3.5 py-3 border border-light-boundary dark:border-dark-boundary'
                )}>
                {/* Make the text vertical and read from bottom to top */}
                <p
                  className={'[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-medium'}>Consonants</p>
              </div>
              <div className={'flex flex-col gap-2 md:flex-row'}>
                <div className={clsx(
                  'grid grid-cols-4 lg:grid-cols-8 gap-2',
                )}>
                  {consonants.map((_consonant, _consonantIndex) => (
                    <IpaSymbol
                      key={_consonantIndex}
                      symbol={_consonant.symbol}
                      representativeWordElement={_consonant.representativeWordElement}
                      containerClassName={clsx(
                        _consonant.containerClassName
                      )}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <NormalText className={'mb-2'}>
          Annotation:
        </NormalText>
        <div className={'flex flex-col md:flex-row gap-6'}>
          <div className={'flex items-center gap-2'}>
            <div className={'size-5 lg:size-6 border border-light-boundary dark:border-dark-boundary'}></div>
            Short/Unvoiced (Voiceless) sounds
          </div>

          <div className={'flex items-center gap-2'}>
            <div className={'size-5 lg:size-6 bg-red-600'}></div>
            Long sounds
          </div>

          <div className={'flex items-center gap-2'}>
            <div className={'size-5 lg:size-6 bg-sky-600'}></div>
            Voiced sounds
          </div>
        </div>
      </section>

    </BlogPostLayout>
  </>
}
