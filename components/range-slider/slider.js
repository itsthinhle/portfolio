import clsx from 'clsx'
import React, {memo, useEffect, useRef} from 'react'
import noUiSlider from 'nouislider'

const RangeSlider = ({
  min = 0,
  max = 1000,
  behaviour = 'drag',
  step,
  onSlide,
  className
}) => {
  const ref = useRef(null)

  useEffect(() => {
    console.log('rerender')
    if (!ref || !ref.current) {
      return
    }

    const rangeSliderElement = ref.current

    /* Create the range slider */
    noUiSlider.create(rangeSliderElement, {
      // Set start and end when the component first load
      start: [min, max],
      connect: true, // should the handlers connect to each other?
      behaviour: behaviour,
      range: {
        'min': min,
        'max': max
      },
      step: step,
    })

    /* Create on update event */
    if (onSlide) {
      rangeSliderElement.noUiSlider.on('slide', onSlide)
    }

    return () => {
      rangeSliderElement.noUiSlider.destroy()
    }
    // Note: parent component must wrap events in useCallback
  }, [max, min, onSlide, step])

  return <div className={className} ref={ref}></div>
}

export default RangeSlider
