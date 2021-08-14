const LambdaTester = require('lambda-tester')
const { JSDOM } = require('jsdom')
const axilla = require('../functions/axilla/axilla').handler

const DEFAULT_EVENT = {
  queryStringParameters: {},
  headers: {
    host: 'localhost'
  }
}

const REGEX_IMG_SRC = /^data:image\/([a-z]*);base64,(.*)$/g
const REGEX_BASE64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

function getImageInfo(html) {
  const { window } = new JSDOM(html)
  const image = window.document.querySelector('.display img')
  const matches = [...image.src.matchAll(REGEX_IMG_SRC)][0]
  return {
    format: matches[1],
    base64: matches[2],
  }
}

describe('axilla', () => {

  it('returns defaults', async () => {
    await LambdaTester(axilla)
      .event(DEFAULT_EVENT)
      .expectResolve((result) => {
        const image = getImageInfo(result.body)
        expect(result.statusCode).toEqual(200)
        expect(result.headers['content-type']).toEqual('text/html')
        expect(image.format).toEqual('webp')
        expect(image.base64).toMatch(REGEX_BASE64)
      })
  })

})
