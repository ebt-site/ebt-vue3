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

## Footnotes

### Inline footnotes
Markdown footnotes are written using the following syntax for 
inline footnotes^[this is an inline footnote]:

> ```...the following syntax^[footnote-text]```.

### Normal footnotes
Alternatively, you can use a different syntax with:

* Inline footnote reference[^a]. E.g., ```...reference[^a]```.
* Appended footnote text. E.g., ```[^a]: this is a normal footnote```

For more documentation, see this [link](https://github.com/markdown-it/markdown-it-footnote)

## HTML5
You can include many HTML5 elements such as `<audio>` on your
EBT site wiki pages. 
For example, if you have an audio file at:

* ```public/audio/simple-bell.ogg```

Then you can add the following HTML to any of your Markdown files:

* ``` <audio controls src="audio/simple-bell.ogg">simple-bell</audio> ```

<audio controls src="audio/simple-bell.ogg">simple-bell</audio>

## Emojis
Copy emojis from [emojipedia](https://emojipedia.org/red-heart/).
For example, here is a red heart:

❤️

[^a]: this is a normal footnote
