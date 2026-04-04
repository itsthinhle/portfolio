import IpaSymbol from '@/app/blogs/english-pronunciation/components/ipa-symbol'
import {
  consonantRows, consonantRows1, consonantRows2, consonants, diphthongs,
  monophthongs
} from '@/app/blogs/english-pronunciation/constants/ipa-symbols'
import BlogPostLayout from '@/components/layouts/blog-post'
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
      <section className={'container-layout text-center'}>
        <div className={'inline-flex flex-col gap-2'}>
          {/* Vowels */}
          <div className={clsx(
            'inline-flex gap-2',
          )}>
            <div
              className={clsx(
                'self-stretch flex items-center',
                'px-3.5 py-3 border border-light-boundary dark:border-dark-boundary'
              )}>
              {/* Make the text vertical and read from bottom to top */}
              <p className={'[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-medium'}>Vowels</p>
            </div>

            <div className={'flex flex-col gap-2 lg:flex-row items-start'}>
              {/* Monophthongs */}
              <div className={clsx(
                'grid grid-cols-4 gap-2 content-center',
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
                      'size-22 content-center',
                      _monophthong.containerClassName
                    )}
                  />
                ))}
              </div>

              {/* Diphthongs */}
              <div className={clsx(
                'grid grid-cols-4 gap-2 content-center',
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
                      'size-22 content-center',
                      _diphthong.containerClassName
                    )}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Consonants */}
          <div className={clsx(
            'inline-flex items-center gap-2',
          )}>
            <div
              className={clsx(
                'self-stretch flex items-center',
                'px-3.5 py-3 border border-light-boundary dark:border-dark-boundary'
              )}>
              {/* Make the text vertical and read from bottom to top */}
              <p className={'[writing-mode:vertical-rl] [text-orientation:mixed] rotate-180 font-medium'}>Consonants</p>
            </div>
            <div className={'flex flex-col gap-2 md:flex-row'}>
              <div className={clsx(
                'grid grid-cols-4 lg:grid-cols-8 gap-2 content-center',
              )}>
                {consonants.map((_consonant, _consonantIndex) => (
                  <IpaSymbol
                    key={_consonantIndex}
                    symbol={_consonant.symbol}
                    representativeWordElement={_consonant.representativeWordElement}
                    containerClassName={clsx(
                      'size-22 content-center',
                      _consonant.containerClassName
                    )}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </BlogPostLayout>
  </>
}
