export const toNearestStep = (_number, _step = 1000) => {
  return Math.floor(_number / _step) * _step
}

export const toCurrencyFormat = (_number, _locales = 'en-US', _currency = 'USD') => {
  const formatter = new Intl.NumberFormat(_locales , {
    style: 'currency',
    currency: _currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })

  return formatter.format(_number)
}