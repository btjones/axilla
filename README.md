# Axilla

A web-based implementation of [Pixlet](https://github.com/tidbyt/pixlet) which is used to develop [Tidbyt](https://tidbyt.com/) applications.

See it live: [`axilla.netlify.app`](https://axilla.netlify.app)

![AXILLA](https://axilla.netlify.app/?output=image)

## Axilla Query Parameters

_note: all query parameters are optional_

| Parameter | Default  | Description |
|-----------|----------|-------------|
| format    | `webp`   | Image format generated by Pixlet. `webp` or `gif` |
| output    | `html`   | Output type returned by the API. `html`, `image`, or `base64`|
| applet    | _AXILLA_ | URL of a Pixlet applet (which should be a [Starlark](https://github.com/bazelbuild/starlark) `.star` file.). |

## Applet Query Parameters

Query parameters can be passed to Pixlet for use within an applet (i.e. `config.get('param')`). These parameters are defined by the applet itself. _Note: Axilla query parameters listed above are reserved and will not be passed to the applet._

## Examples

### All Defaults

[`axilla.netlify.app`](https://axilla.netlify.app)

### Raw GIF Image

[`format=gif&output=image`](https://axilla.netlify.app/?format=gif&output=image)

### Base 64 Image String

[`output=base64`](https://axilla.netlify.app/?output=base64)

### Other Parameters

The default Axilla applet accepts one parameter: `text`. Other applets can define and accept their own query parameters.

[`text=You%20Rock!`](https://axilla.netlify.app/?text=You%20Rock!)

### External Applets

- [`applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/hello_world.star`](https://axilla.netlify.app/?applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/hello_world.star)
- [`applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/clock.star`](https://axilla.netlify.app/?applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/clock.star)
- [`applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/quadrants.star`](https://axilla.netlify.app/?applet=https://raw.githubusercontent.com/tidbyt/pixlet/main/examples/quadrants.star)

## Forking / Netlify Deployment

Axilla is deployed to [Netlify](https://www.netlify.com) and utilizes [Netlify Functions](https://www.netlify.com/products/functions/) (which uses [AWS Lambda](https://aws.amazon.com/lambda/) under the hood). To deploy your own version of Axilla:

1. Fork this repo (click Fork button on the top-right corner of this page)
2. [Link your forked repo to Netlify](https://www.netlify.com/blog/2016/09/29/a-step-by-step-guide-deploying-on-netlify/)
3. Visit https://YOUR-SITE-NAME.netlify.app/

## Local Development

- [Install Netlify Dev](https://www.netlify.com/products/dev/)
- [Install Pixlet](https://github.com/tidbyt/pixlet#getting-started)

Run `netlify dev` from your Axilla project directory.

Note: When running locally, Axilla assumes you have Pixlet installed globally on your system and will use the `pixlet` command to execute. A version of Pixlet is included in this repo but has been built to run on the [Amazon Linux 2](https://aws.amazon.com/amazon-linux-2/) operating system so that it can run when deployed as a Netlify/Lambda function.
