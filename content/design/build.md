---
title: Build process
description: Content build automation
detail: Sat Jul 22 09:27:46 AM PDT 2023
img: pexels-pixabay-417171.png
img-alt: Train station
link: https://www.pexels.com/photo/black-and-white-building-city-commuter-417171/
category: 1. General
order: 2
---

Github automatically rebuilds your EBT-Site using 
[Github actions](https://github.com/features/actions):

* **push-action**: invoked when content is added or changed.
* **scheduled-action**: invoked at regular intervals during the day

## Push actions

The *push-action* automation is invoked whenever your Github repository is updated
with new content. These are typically updates updates for:

* Markdown files (```content/...```)
* Images (```public/img/...```)
* Audio (```public/audio/...```)

### Markdown files
The *push-action* automation generates HTML files for display on the web.
For example, the markdown file 

* ```content/welcome.md``` 

will be processed into 

* ```public/content/welcome.html```

The HTML files will then be used to update your website.

### Images and Audio
Each image and audio file will be given its own URL for the website.
Suppose you have the following EBT-Site:

* Github account "sc-voice"
* Github repository "ebt-site3"

If you have an image at ```public/img/wheel.png``` in your repository, then
the image URL will be ```https://sc-voice.github.io/ebt-site3/img/wheel.png```.
Like [this](https://sc-voice.github.io/ebt-site3/img/wheel.png).

You can add images and audio to your EBT-Site simply by using the appropriate
URLs in your Markdown files.

## Scheduled actions

Schedule actions run periodically to:

* Update EBT content from [SuttaCentral](https://suttacentral.net). This includes new translations as well as translation updates from Bilara
* Update EBT-Site software with security fixes and feature updates. NOTE: EBT-Site version number is displayed in *Settings* on the *Advanced* section title.
