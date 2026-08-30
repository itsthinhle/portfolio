const get = async(_url, _headers = {}) => {
  try {
    return await fetch(_url, {
      method: 'GET',
      headers: _headers
    })
  } catch (error) {
    throw error
  }
}

const post = async(_url, _body = {}, _headers = {}) => {
  try {
    return await fetch(_url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ..._headers
      },
      body: JSON.stringify(_body)
    })
  } catch (error) {
    throw error
  }
}

const apiUtility = {
  get,
  post
}

export default apiUtility
