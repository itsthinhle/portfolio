import {usePathname} from 'next/navigation'
import React, {memo} from 'react'
import {aboutMePage, contactMePage, homePage, projectsPage} from '../../constants/pages'
import Link from 'next/link'
import {isActiveNavigationItem} from '@/utilities/navigation-item'
import clsx from 'clsx'

const HeaderNavigationMenu = memo(() => {
  const pathname = usePathname()

  return <nav
    className={'hidden lg:inline-flex lg:space-x-6 lg:items-center'}>
    {
      [homePage, aboutMePage, projectsPage, contactMePage]
        .map((_navigationItem, _index) => {
          return <Link
            aria-label={_navigationItem.title}
            key={_index}
            href={_navigationItem.path}
            prefetch={true}
            className={clsx([
              'flex gap-2 items-center font-semibold',
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

export default HeaderNavigationMenu
