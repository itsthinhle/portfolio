import {Loading03Icon} from '@hugeicons-pro/core-stroke-rounded'
import {HugeiconsIcon} from '@hugeicons/react'
import React from 'react'

export default function LoadingIcon({
  className
}) {
  return <HugeiconsIcon icon={Loading03Icon} className={`animate-spin ${className}`} />
}