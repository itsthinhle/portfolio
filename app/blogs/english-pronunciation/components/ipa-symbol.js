'use client'
import NormalText from '@/components/texts/normal'
import clsx from 'clsx'
import React, {useRef} from 'react'

export default function IpaSymbol({
  symbol,
  representativeWordElement,
  audioPath,
  className
}) {
  const ref = useRef(null)

  return <div
    onClick={() => ref.current?.play()}
    className={clsx(
      'cursor-pointer p-2 size-full',
      className
    )}
  >
    <p className="text-lg lg:text-xl font-medium">
      {symbol}
    </p>
    {representativeWordElement}


    <audio ref={ref} src={audioPath} />
  </div>
}