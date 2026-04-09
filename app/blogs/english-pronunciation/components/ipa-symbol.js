import clsx from 'clsx'

export default function IpaSymbol({
  symbol,
  representativeWordElement,
  containerClassName,
}) {

  return <div
    className={clsx(
      'h-18 min-w-18 lg:size-23 content-center',
      containerClassName
    )}>
    <p className="text-lg lg:text-xl font-medium">
      {symbol}
    </p>
    {representativeWordElement}
  </div>
}