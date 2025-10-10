import {usePathname} from 'next/navigation'
import React, {memo} from 'react'
import {aboutMePage, contactMePage, homePage, projectsPage} from '../../constants/pages'
import Link from 'next/link'
import {isActiveNavigationItem} from '@/utilities/navigation-item'
import clsx from 'clsx'

const VerticalNavigationMenu = memo(({
  ref
}) => {
  const pathname = usePathname()

  const onNavigationItemClick = () => {
    ref.current.classList.toggle('hidden')
  }

  return <nav
    ref={ref}
    className={clsx([
      'hidden absolute left-0 right-0 container-layout rounded-b-xl',
      'bg-light dark:bg-dark shadow-xl shadow-light-accent/25 dark:shadow-dark-accent/25',
      'flex flex-col space-y-6 pb-6'
    ])}>
    {
      [homePage, aboutMePage, projectsPage, contactMePage]
        .map((_navigationItem, _index) => {
          return <Link
            aria-label={_navigationItem.title}
            key={_index}
            href={_navigationItem.path}
            onClick={onNavigationItemClick}
            className={clsx([
              'font-semibold text-right',
              isActiveNavigationItem(pathname, _navigationItem.path)
                ? 'text-light-accent dark:text-dark-accent'
                : 'hover:text-light-accent dark:hover:text-dark-accent'
            ])}>
            {_navigationItem.title}
          </Link>
        })
    }
  </nav>
})

export default VerticalNavigationMenu