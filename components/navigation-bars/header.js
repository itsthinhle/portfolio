import clsx from 'clsx'
import React, {useEffect, useRef} from 'react'
import {HugeiconsIcon} from '@hugeicons/react'
import {Menu01Icon, QuillWrite02Icon} from '@hugeicons-pro/core-stroke-rounded'
import Link from 'next/link'
import {homePage} from '@/constants/pages'
import HeaderNavigationMenu from '@/components/navigation-menus/header'
import VerticalNavigationMenu from '@/components/navigation-menus/vertical'
import {lg} from '@/constants/screen-breakpoints'

export default function HeaderNavigationBar() {
  const verticalNavigationMenuRef = useRef(null)

  /* Hide vertical navigation menu when screen width exceeded lg breakpoint */
  useEffect(() => {
    const onWindowResize = () => {
      if (window.innerWidth >= lg) {
        const isVerticalNavigationMenuHidden = verticalNavigationMenuRef.current
          .classList
          .contains('hidden')

        if (!isVerticalNavigationMenuHidden) {
          verticalNavigationMenuRef.current.classList.toggle('hidden')
        }
      }
    }

    window.addEventListener('resize', onWindowResize)

    return () => {
      window.removeEventListener('resize', onWindowResize)
    }
  }, [])

  return <>
    <div
      className={clsx([
        'container-layout py-6 flex justify-between items-center',
      ])}>
      <Link
        aria-label={'Website logo'}
        href={homePage.path}
        prefetch={true}>
        <HugeiconsIcon icon={QuillWrite02Icon} size={32} />
      </Link>
      <HeaderNavigationMenu />
      <button
        type="button"
        aria-label={'Hamburger button on the horizontal navigation bar'}
        className={'lg:hidden cursor-pointer hover:text-light-accent dark:hover:text-dark-accent'}
        onClick={() =>
          verticalNavigationMenuRef.current.classList.toggle('hidden')
        }>
        <HugeiconsIcon icon={Menu01Icon} />
      </button>
    </div>
    <VerticalNavigationMenu
      ref={verticalNavigationMenuRef} />
  </>
}
