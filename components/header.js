'use client'
import React, {useEffect, useRef} from 'react'
import clsx from 'clsx'
import HeaderNavigationBar from '@/components/navigation-bars/header'

export default function Header() {
  const sentinelRef = useRef(null)
  const headerRef = useRef(null)

  console.log('test header')
  /* Set shadow for header when scrolling */
  useEffect(() => {
    const observeSentinel = ([entry]) => {
      if (headerRef.current) {
        if (!entry.isIntersecting) {
          headerRef.current.classList.add(
            'shadow-xl',
            'shadow-light-accent/25',
            'dark:shadow-dark-accent/25')
        } else {
          headerRef.current.classList.remove(
            'shadow-xl',
            'shadow-light-accent/25',
            'dark:shadow-dark-accent/25')
        }
      }
    }

    const sentinelObserver = new IntersectionObserver(
      observeSentinel,
      {
        // [Tip]: root is the view box for checking the object intersection
        // it's an invisible rectangle with default size is the device view port
        root: null,
        // [Tip]: threshold is the percentage
        //    0: first pixel of the element is considered intersected
        //    ...:
        //    1: full element is considered intersected
        threshold: 0,
        // [Tip]: rootMargin is for making the view box bigger or smaller by margin
        rootMargin: '0px 0px 0px 0px'
      }
    )

    const sentinel = sentinelRef.current

    if (sentinel) {
      sentinelObserver.observe(sentinel)
    }

    return () => {
      if (sentinel) {
        sentinelObserver.unobserve(sentinel)
        sentinelObserver.disconnect()
      }
    }
  }, [])

  return <>
    <div ref={sentinelRef}></div>
    <header
      ref={headerRef}
      className={clsx([
        'sticky top-0 z-50 transition-box-shadow duration-250',
        'bg-light dark:bg-dark'
      ])}>
      <HeaderNavigationBar />
    </header>
  </>
}
