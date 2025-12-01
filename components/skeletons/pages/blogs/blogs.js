import React from 'react'

/* Update the number of projects when you add more */
export default function BlogsSkeleton() {
  const generateBlogCards = () => {
    let numberOfProjects = 2
    const cards = []
    const tagDiv = <div className={'h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded-full grow'}></div>

    while (numberOfProjects > 0) {
      cards.push(<article
        key={numberOfProjects}
        className={'flex flex-col sm:flex-row gap-8 isolate animate-pulse'}>
        {/* Cover image */}
        <div
          className={'sm:shrink-0 w-full sm:w-65 aspect-video sm:aspect-square rounded-2xl bg-gray-200 dark:bg-gray-700'}>
        </div>
        <div className={'flex flex-col grow'}>
          {/* Creation date */}
          <p className={'w-1/4 h-3 lg:h-4 bg-gray-200 dark:bg-gray-700 rounded-full mb-3'}></p>
          {/* Title */}
          <p className={'w-1/2 h-6 bg-gray-200 dark:bg-gray-700 rounded-full mb-5'}></p>
          {/* Description */}
          <div className={'mb-8'}>
            <div className={'w-9/10 h-4 lg:h-4.5 my-2 bg-gray-200 dark:bg-gray-700 rounded-full'}></div>
            <div className={'w-full h-4 lg:h-4.5 my-2 bg-gray-200 dark:bg-gray-700 rounded-full'}></div>
            <div className={'w-4/5 h-4 lg:h-4.5 my-2 bg-gray-200 dark:bg-gray-700 rounded-full'}></div>
          </div>
          {/* Tags */}
          <div className={'flex gap-2 items-center'}>
            {tagDiv}
            {tagDiv}
            {tagDiv}
            {tagDiv}
          </div>
        </div>
      </article>
      )
      numberOfProjects -= 1
    }

    return cards
  }

  return <div className={'grid grid-cols-1 xl:grid-cols-2 gap-x-8 gap-y-16'}>
    {generateBlogCards()}
  </div>
}
