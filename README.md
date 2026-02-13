# ImageGrab

[![Release](https://img.shields.io/github/v/release/madhusudan-kulkarni/imagegrab?display_name=release&logo=github)](https://github.com/madhusudan-kulkarni/imagegrab/releases/latest)
[![Chrome MV3](https://img.shields.io/badge/Chrome-MV3-4285F4?logo=googlechrome&logoColor=white)](https://github.com/madhusudan-kulkarni/imagegrab/releases/latest/download/imagegrab-chrome.zip)
[![Firefox MV3](https://img.shields.io/badge/Firefox-MV3-FF7139?logo=firefoxbrowser&logoColor=white)](https://github.com/madhusudan-kulkarni/imagegrab/releases/latest/download/imagegrab-firefox.zip)
[![CI](https://img.shields.io/github/actions/workflow/status/madhusudan-kulkarni/imagegrab/ci.yml?branch=main&label=CI)](https://github.com/madhusudan-kulkarni/imagegrab/actions/workflows/ci.yml)

Quickly save images from webpages, one at a time or in batch.

## Features

- One-click image save from context menu
- Batch image downloader with selectable grid
- Scrapes `img`, `srcset`, and CSS `background-image`
- Hover save button for images larger than `150x150`
- Filename template variables: `${original_name}`, `${ext}`, `${domain}`, `${timestamp}`, `${index}`

## Run

```bash
pnpm install
pnpm dev
pnpm dev:firefox
```

## Build

```bash
pnpm build
pnpm zip
pnpm build:firefox
pnpm zip:firefox
```
