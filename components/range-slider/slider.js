import clsx from 'clsx'
import React, {memo, useEffect, useRef} from 'react'
import noUiSlider from 'nouislider'

const RangeSlider = ({
  min = 0,
  filteredMin = 0,
  max = 100,
  filteredMax = 100,
  behaviour = 'drag-tap',
  step,
  toValue,
  fromValue,
  onChange,
  containerClassName,
  tooltipClassName,
  ref
}) => {
  const rangeSliderContainerRef = useRef(null)

  useEffect(() => {
    if (!ref || !ref.current) {
      return
    }

    const rangeSliderElement = ref.current

    /* Create the range slider */
    noUiSlider.create(rangeSliderElement, {
      start: [20, 80],
      connect: true,
      range: {
        'min': 0,
        'max': 100
      }
    })

    return () => {
      rangeSliderElement.noUiSlider.destroy()
    }
  }, [ref])

  return <div className={clsx([
    containerClassName
  ])}>
    <div
      ref={rangeSliderContainerRef}
      className={clsx([
        'pb-1.5 lg:pb-2.25 pt-9 lg:pt-10.75'
      ])}>
      <div
        ref={ref}></div>
    </div>
  </div>
}

export default RangeSlider
