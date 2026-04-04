import clsx from 'clsx'

export default function IpaSymbol({
  symbol,
  representativeWordElement,
  containerClassName,
}) {

  return <div
    className={clsx(
      containerClassName
    )}>
    <p className="text-lg lg:text-xl font-medium">
      {symbol}
    </p>
    {representativeWordElement}
  </div>
}