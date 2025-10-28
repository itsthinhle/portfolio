import React from 'react'

export default function ProjectsSkeleton() {
  const generateBlogCards = () => {
    let numberOfProjects = 1
    const cards = []
    const tagDiv = <div className={'h-7 lg:h-8 bg-gray-200 dark:bg-gray-700 rounded-full grow'}></div>

    while (numberOfProjects > 0) {
      cards.push(<article
        key={numberOfProjects}
        className={'flex flex-col animate-pulse'}>
        <div
          className={'aspect-video sm:aspect-2/1 lg:aspect-3/2 object-cover rounded-2xl bg-gray-200 dark:bg-gray-700 mb-8'}>
        </div>
        {/* Time */}
        <div className={'h-4 lg:h-5 bg-gray-200 dark:bg-gray-700 w-1/2 rounded-full mb-3'}></div>
        {/* Title */}
        <div className={'h-6 bg-gray-200 dark:bg-gray-700 w-full rounded-full mb-5'}></div>
        {/* Description */}
        <div className={'h-18 bg-gray-200 dark:bg-gray-700 w-full rounded-md mb-8'}></div>
        {/* Tags */}
        <div className={'flex gap-2 items-center'}>
          {tagDiv}
          {tagDiv}
          {tagDiv}
        </div>
      </article>)
      numberOfProjects -= 1
    }

    return cards
  }

  return <section className={'pt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16'}>
    {generateBlogCards()}
  </section>
}
