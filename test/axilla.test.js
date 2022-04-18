const lambdaTester = require('lambda-tester')
const { JSDOM } = require('jsdom')
const fetch = require('node-fetch')
const fs = require('fs')
const axilla = require('../functions/axilla/axilla')

const { handler, test } = axilla
const { readFile } = fs.promises
const { accessSync } = fs

// mock node-fetch so that we can load local files instead
jest.mock('node-fetch')

// expected base64 output from the test.star applet
const APPLET_BASE64_WEBP = 'UklGRjoAAABXRUJQVlA4TC0AAAAvP8AHAA8w//M///MfeFDbSFIzeNcGZRPSKjFpRP8nAAB5ALkDZwD7FYC7/CQA'
const APPLET_BASE64_GIF = 'R0lGODlhQAAgAAAAACH5BAAFAAAALAAAAABAACAAgAAAAP///wJD8DF1uf0hDGmCGnF2l2r/j0A0Rgs8s0ol0fZZTVduVnHi5lzf+d7/gUHhkFg0HpFJ5ZLZdD6hUemUWrVesVntlgssAAA7'
const APPLET_BASE64_WEBP_WITH_PARAM = 'UklGRkIAAABXRUJQVlA4TDYAAAAvP8AHAA8w//M///MfeFATSVK0tSgCBcREpw1laPiF3JOSRvR/AhAUJKoKGiNPQ1r3YJRH9Ys='
const APPLET_BASE64_GIF_WITH_PARAM = 'R0lGODlhQAAgAAAAACH5BAAFAAAALAAAAABAACAAgAAAAP///wJR8DF1uf2hCmCyUBOOe2u5PE78Luw6zDMcWcp1q9iQ11ac6Fl/a/vmZ7ETReUzHpFJ5ZLZdD6hUemUWrVesVntltv1fsFh8ZhcNp/RafWabSgAADs='

// used to test for valid image format and base64 encoding
const REGEX_IMG_SRC = /^data:image\/([a-z]*);base64,(.*)$/g
const REGEX_BASE64 = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/

// applet test files
const APPLET_TEST_PATH = 'test/test-good.star'
const APPLET_TEST_PATH_BAD = 'test/test-bad.star'

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
    queryStringParameters: params,
  }
}

// replace fetch implementation and load local file instead
const mockFetchGood = async (path) => {
  const data = await readFile(path, 'utf8')
  return Promise.resolve({
    ok: true,
    status: 200,
    text: () => data,
  })
}

describe('axilla', () => {

  describe('defaults', () => {

    it('returns defaults when no parameters are provided', async () => {
      await lambdaTester(handler)
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
      await lambdaTester(handler)
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
      await lambdaTester(handler)
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
      await lambdaTester(handler)
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
      await lambdaTester(handler)
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
      await lambdaTester(handler)
        .event(getEvent({ output: 'image' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('image/webp')
          expect(result.body).toMatch(REGEX_BASE64)
        })
    })

    it('returns base64 text', async () => {
      await lambdaTester(handler)
        .event(getEvent({ output: 'base64' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/plain')
          expect(result.body).toMatch(REGEX_BASE64)
        })
    })

    it('returns html for invalid output', async () => {
      await lambdaTester(handler)
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
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
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
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
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

  describe('other parameters', () => {

    it('accepts other parameters', async () => {
      await lambdaTester(handler)
        .event(getEvent({ text: 'wowsers' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

    it('ignores parameters that begin with `-`', async () => {
      await lambdaTester(handler)
        .event(getEvent({ '--hmm': 'nope' }))
        .expectResolve((result) => {
          const image = getImageInfo(result.body)
          expect(result.statusCode).toEqual(200)
          expect(result.headers['content-type']).toEqual('text/html')
          expect(image.format).toEqual('webp')
          expect(image.base64).toMatch(REGEX_BASE64)
        })
    })

  })

  describe('combinations', () => {

    it('gif + image + applet + custom parameter', async () => {
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
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
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
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
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
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

  describe('cleanup', () => {

    it('deletes the temp input file after processing', async () => {
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
        .event(getEvent({ applet: APPLET_TEST_PATH }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(() => { accessSync(test.INPUT_APPLET_PATH) }).toThrow()
        })
    })

    it('deletes the temp output file after processing', async () => {
      const tempOutputPath = test.getOutputPath('webp')
      await lambdaTester(handler)
        .event(getEvent())
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(200)
          expect(() => { accessSync(tempOutputPath) }).toThrow()
        })
    })

  })

  describe('errors', () => {

    it('returns an error when failing to fetch applet', async () => {
      // mock fetch to return a 404
      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        text: () => null,
      })
      await lambdaTester(handler)
        .event(getEvent({ applet: 'https://gopher.farts' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(404)
          expect(result.body).toMatch(/Could not fetch applet/)
        })
    })

    it('returns an error for an invalid applet url', async () => {
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
        .event(getEvent({ applet: 'gopher:////farts' }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(500)
          expect(result.body).toMatch(/Could not download applet/)
        })
    })

    it('returns an error when writing the applet to disk fails', async () => {
      // mock fetch to not write data
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        text: () => null,
      })
      await lambdaTester(handler)
        .event(getEvent({ applet: APPLET_TEST_PATH }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(500)
          expect(result.body).toMatch(/Could not download applet/)
        })
    })

    it('returns an error for a bad applet', async () => {
      fetch.mockImplementationOnce(mockFetchGood)
      await lambdaTester(handler)
        .event(getEvent({ applet: APPLET_TEST_PATH_BAD }))
        .expectResolve((result) => {
          expect(result.statusCode).toEqual(500)
          expect(result.body).toMatch(/Ensure the provided applet is valid/)
          expect(result.body).toMatch(/Failed to generate image with Pixlet/)
        })
    })

    // these will require more complex mocking
    // because we're already using `readFile` to mock `fetch` calls
    // and the code that throws these errors all rely on `readFile`
    it.todo('Could not read output file')
    it.todo('Could not read output image')
    it.todo('Could not generate html')
  })

  describe('version', () => {

    // we currently use an older version of pixlet for our github workflow
    // the old version of pixlet does not support the "version" param
    // if we upgrade pixlet for the github workflow, we can run these there
    if (process.env.IS_DEV) {

      it('getPixletVersion returns formatted version info', async () => {
        const pixletVersion = await test.getPixletVersion()
        expect(pixletVersion).toBeDefined()
        expect(pixletVersion.length).toBeGreaterThan(0)
      })

      it('returns version info when the "version" param is "true"', async () => {
        await lambdaTester(handler)
          .event(getEvent({ version: 'true' }))
          .expectResolve((result) => {
            expect(result.statusCode).toEqual(200)
            expect(result.headers['content-type']).toEqual('text/plain')
            expect(result.body.indexOf('Pixlet version:')).toBeGreaterThan(-1)
          })
      })

    } else {

      it.todo('getPixletVersion returns formatted version info (requires pixlet update)')
      it.todo('returns version info when the "version" param is "true" (requires pixlet update)')

    }

  })

})
