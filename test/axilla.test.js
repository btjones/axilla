const lambdaTester = require('lambda-tester')
const { JSDOM } = require('jsdom')
const axilla = require('../functions/axilla/axilla').handler
const fetch = require('node-fetch')
const { readFileSync } = require('fs')

// mock node-fetch so that we can load local files instead
jest.mock('node-fetch', () => jest.fn())

// expected base64 output from the test.star applet
const APPLET_BASE64_WEBP = 'UklGRjoAAABXRUJQVlA4TC0AAAAvP8AHAA8w//M///MfeFDbSFIzeNcGZRPSKjFpRP8nAAB5ALkDZwD7FYC7/CQA'
const APPLET_BASE64_GIF = 'R0lGODlhQAAgAAAAACH5BAAFAAAALAAAAABAACAAgAAAAP///wJD8DF1uf0hDGmCGnF2l2r/j0A0Rgs8s0ol0fZZTVduVnHi5lzf+d7/gUHhkFg0HpFJ5ZLZdD6hUemUWrVesVntlgssAAA7'
const APPLET_BASE64_WEBP_WITH_PARAM = 'UklGRkIAAABXRUJQVlA4TDYAAAAvP8AHAA8w//M///MfeFATSVK0tSgCBcREpw1laPiF3JOSRvR/AhAUJKoKGiNPQ1r3YJRH9Ys='
const APPLET_BASE64_GIF_WITH_PARAM = 'R0lGODlhQAAgAAAAACH5BAAFAAAALAAAAABAACAAgAAAAP///wJR8DF1uf2hCmCyUBOOe2u5PE78Luw6zDMcWcp1q9iQ11ac6Fl/a/vmZ7ETReUzHpFJ5ZLZdD6hUemUWrVesVntltv1fsFh8ZhcNp/RafWabSgAADs='

// used to test for valid image format and base64 encoding
const REGEX_IMG_SRC = /^data:image\/([a-z]*);base64,(.*)$/g
const REGEX_BASE64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

// applet test file
const APPLET_TEST_PATH = 'test/test.star'

// returns the format and base64 portion of the img tag src attribute from the provided html string
const getImageInfo = (html) => {
  const { window } = new JSDOM(html)
  const image = window.document.querySelector('.display img')
  const matches = [...image.src.matchAll(REGEX_IMG_SRC)][0]
  return {
    format: matches[1],
    base64: matches[2],
  }
}

// returns a function event object with the provided params
const getEvent = (params = {}) => {
  return {
    queryStringParameters: params
  }
}

describe('axilla', () => {

  // replace fetch implementation and load local file instead
  fetch.mockImplementation((path, options) => {
    const data = readFileSync(path, 'utf8')
    return Promise.resolve({
      ok: true,
      status: 200,
      statusText: '',
      text: () => {
        return data
      },
    })
  })

  describe('defaults', () => {

    it('returns defaults when no parametrs are provided', async () => {
      await lambdaTester(axilla)
        .event(getEvent())
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

  })

  describe('format', () => {

    it('returns webp image', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ format: 'webp' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

    it('returns gif image', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ format: 'gif' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('gif')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

    it('returns webp image for invalid format', async () => {
      await lambdaTester(axilla)
      .event(getEvent({ format: '🌶' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

  })

  describe('output', () => {

    it('returns html', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ output: 'html' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

    it('returns image', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ output: 'image' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('image/webp')
          expect(result.body).toMatch(REGEX_BASE64)
        })
    })

    it('returns base64 text', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ output: 'base64' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/plain')
          expect(result.body).toMatch(REGEX_BASE64)
        })
    })

    it('returns html for invalid output', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ output: '🧀' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

  })

  describe('applet', () => {

    it('returns custom applet data', async () => {
      await lambdaTester(axilla)
        .event(getEvent({ applet: APPLET_TEST_PATH }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(APPLET_BASE64_WEBP)
        })
    })

    it('passes query parameters to custom applet', async () => {
      await lambdaTester(axilla)
        .event(getEvent({
          applet: APPLET_TEST_PATH,
          greeting: '¡hola!',
        }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(APPLET_BASE64_WEBP_WITH_PARAM)
        })
    })

  })

  describe('combinations', () => {

    it('gif + image + applet + custom parameter', async () => {
      await lambdaTester(axilla)
        .event(getEvent({
          format: 'gif',
          output: 'image',
          applet: APPLET_TEST_PATH,
          greeting: '¡hola!',
        }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('image/gif')
          expect(result.body).toMatch(APPLET_BASE64_GIF_WITH_PARAM)
        })
    })

    it('webp + base64 + applet + custom parameter', async () => {
      await lambdaTester(axilla)
        .event(getEvent({
          format: 'webp',
          output: 'base64',
          applet: APPLET_TEST_PATH,
          greeting: '¡hola!',
        }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/plain')
          expect(result.body).toMatch(APPLET_BASE64_WEBP_WITH_PARAM)
        })
    })

    it('gif + html + applet', async () => {
      await lambdaTester(axilla)
        .event(getEvent({
          format: 'gif',
          output: 'html',
          applet: APPLET_TEST_PATH,
        }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('gif')
          expect(image.base64).toMatch(APPLET_BASE64_GIF)
        })
    })

  })

  describe('errors', () => {
    it.todo('invalid applet url / Could not fetch applet.')
    it.todo('writeFile error')
    it.todo('execFile / pixlet error / Failed to generate image with Pixlet.')
    it.todo('readFile error')
    it.todo('no base64 / readfile output / Could not read output image.')
    it.todo('invalid html / Could not generate html.')
  })

})
