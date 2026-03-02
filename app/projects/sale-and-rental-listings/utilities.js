export const getMinAndMaxOfLivingAndLotAreas = (
  _listingDtos
) => {
  return _listingDtos.reduce((_result, _listingDto) => {
    if (_listingDto.livingArea < _result.minLivingArea) {
      _result.minLivingArea = _listingDto.livingArea
    }
    if (_listingDto.livingArea > _result.maxLivingArea) {
      _result.maxLivingArea = _listingDto.livingArea
    }
    if (_listingDto.lotArea < _result.minLotArea) {
      _result.minLotArea = _listingDto.lotArea
    }
    if (_listingDto.lotArea > _result.maxLotArea) {
      _result.maxLotArea = _listingDto.lotArea
    }

    return _result
  }, {
    minLivingArea: _listingDtos[0].livingArea ?? 10000,
    maxLivingArea: _listingDtos[0].livingArea ?? 0,
    minLotArea: _listingDtos[0].lotArea,
    maxLotArea: _listingDtos[0].lotArea
  })
}