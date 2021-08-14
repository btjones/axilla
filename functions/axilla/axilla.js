const fs = require('fs').promises
const util = require('util')
const fetch = require('node-fetch')
const execFile = util.promisify(require('child_process').execFile)

exports.handler = async (event, context) => {

  const CWD = `${__dirname}/`
  const TMP = '/tmp/'
  const ASSETS = `${CWD}assets/`

  const PARAMS = [
    'format',
    'output',
    'applet',
  ]

  const FORMATS = {
    WEBP: 'webp',
    GIF: 'gif',
  }

  const OUTPUTS = {
    HTML: 'html', 
    IMAGE: 'image',
    BASE64: 'base64',
  }

  const DEFAULT_APPLET_PATH = `${ASSETS}default.star`
  const INPUT_APPLET_PATH = `${TMP}input.star`
  const HTML_TEMPLATE_PATH = `${ASSETS}basic.html`

  // query params
  const params = event.queryStringParameters
  const appletUrl = params.applet
  const appletPath = appletUrl ? INPUT_APPLET_PATH : DEFAULT_APPLET_PATH
  const format = params.format && FORMATS[params.format.toUpperCase()] || FORMATS.WEBP
  const output = params.output && OUTPUTS[params.output.toUpperCase()] || OUTPUTS.HTML
  console.log('params', params)

  // download the applet if provided
  if (!!appletUrl) {
    try {
      const response = await fetch(appletUrl, { headers: { Accept: 'text/plain' } })
      if (!response.ok) {
        return {
          statusCode: response.status,
          body: `Error: Could not fetch applet. ${response.statusText}`
        }        
      }
      const appletText = await response.text()
      await fs.writeFile(INPUT_APPLET_PATH, appletText) 
    } catch (error) {
      return {
        statusCode: 500,
        body: `Error: ${error.message}`
      }
    }
  }

  // pixlet binary
  let command = `${CWD}pixlet/pixlet-aws`
  if (process.env.CI) {
    command = `${CWD}pixlet/pixlet-darwin`
  } else if (event.headers.host.includes('localhost')) {
    command = 'pixlet'
  }

  // pixlet args
  const outputPath = `${TMP}output.${format}`
  const args = ['render', appletPath, `--output=${outputPath}`]
  if (format === FORMATS.GIF) {
    args.push('--gif=true')
  }

  // pass non-reserved params to pixlet
  Object.keys(params).forEach(key => {
    if (!PARAMS.includes(key)) {
      args.push(`${key}=${params[key]}`)
    }
  })

  // run pixlet
  try {
    await execFile(command, args)
  } catch (error) {
    const appletMessage = !!appletUrl ? 'Ensure the provided applet is valid.' : ''
    return {
      statusCode: 500,
      body: `Error: Failed to generate image with Pixlet. ${appletMessage}`
    }
  }

  // base64 encode the generated image
  let imageBase64
  try {
    imageBase64 = await fs.readFile(outputPath, 'base64')
  } catch (error) {
    return {
      statusCode: 500,
      body: `Error: ${error.message}`
    }
  }  

  // check base64 data
  if (!imageBase64) {
    return {
      statusCode: 500,
      body: 'Error: Could not read output image.'
    }
  }

  switch (output) {

    // raw image
    case OUTPUTS.IMAGE:
      return {
        statusCode: 200,
        headers: { 'content-type': `image/${format}` },
        body: imageBase64,
        isBase64Encoded: true
      }

    // base64 image text
    case OUTPUTS.BASE64:
      return {
        statusCode: 200,
        headers: { 'content-type': 'text/plain' },
        body: imageBase64
      }

    // html preview
    case OUTPUTS.HTML:
    default:
      let html
      try {
        html = await fs.readFile(HTML_TEMPLATE_PATH, 'utf8')
        html = html.replace(/\{format\}|\{image\}/gi, (match) => {
          if (match === '{format}') return format
          if (match === '{image}') return imageBase64
        })
      } catch (error) {
        return {
          statusCode: 500,
          body: `Error: Could not generate html. ${error.message}`
        }
      }

      return {
        statusCode: 200,
        headers: { 'content-type': 'text/html' },
        body: html
      }

  }

}
