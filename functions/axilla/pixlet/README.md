# Pixlet Binaries

## `pixlet-aws`

Version: 0.17.2 (commit: [2fd1466](https://github.com/tidbyt/pixlet/commit/2fd1466d2ca6a4c9757a1d6b3c9edbf7989a24bd))

`pixlet-aws` is [built from source](https://github.com/tidbyt/pixlet/blob/2eaa1e34257b954a778a7878e21d9837e3befb52/BUILD.md) using an Amazon EC2 instance.

## `pixlet-github`

Version: 0.8.2 ([official release](https://github.com/tidbyt/pixlet/releases))

`pixlet-github` uses an [official pixlet linux_amd64 release](https://github.com/tidbyt/pixlet/releases). Note: Versions newer than 0.8.2 fail to execute within Github Actions (Ubuntu 20.04 aka `ubuntu-latest`). Axilla unit tests currently don't require a newer version of `pixlet` so this is ok for now.
