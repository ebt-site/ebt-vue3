---
title: Designing with Markdown
description: Style your wiki using Markdown
img: pexels-kaboompics-com-6444.png
alt: Generic picture of design
link: https://www.pexels.com/photo/black-pencils-and-design-word-6444/
category: 1. General
order: 4
---

## Markdown
EBT website wikis are written using
[Github Markdown](https://www.markdownguide.org/basic-syntax).

NOTE: The Markdown processor used by EBT websites 
has less features than Gihub Markdown but
supports HTML5 elements.

### Mardown metadata
At the top of each Markdown file is a *metadata* block which
describes the page.

| property | description |
| :---- | :---- |
| title | wiki page title |
| description | short description shown under title |
| detail | (optional, multiple) detailed description items |
| img | file name of image |
| alt | image accessible title |
| link | image source and/or attribution |
| category | category title for grouping in wiki table of contents |
| order | order within category (alphabetical otherwise) |

## Images

Each wiki page has its own image. 
You can also add your own images.
Add new images to the following folder:

* <kbd>public/img</kbd> folder.

To preserve disk space and network performance, keep your images small.
For example, each wiki page header image should be 250wx200h pixels, preferably in PNG format.

## HTML5
You can include many HTML5 elements such as `<audio>` on your
EBT site wiki pages. 
For example, if you have an audio file at:

* ```public/audio```

Then you can add the following HTML to any of your Markdown files:

* ``` <audio controls src="audio/simple-bell.ogg"/> ```

<audio controls src="audio/simple-bell.ogg"/>

## Emojis
Copy emojis from [emojipedia](https://emojipedia.org/red-heart/).
For example, here is a red heart:

❤️

