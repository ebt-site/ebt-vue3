---
title: ebt-config
description: Configure EBT-Site for new repository
detail: Sat Jul 22 06:15:52 AM PDT 2023
img: faizan-saeed-PPeZwFWnWNE-unsplash.png
img-alt: Hummingbird reaching to drink nectar from flowers
link: https://unsplash.com/photos/PPeZwFWnWNE 
category: 1. General
order: 2
---

### Customize content

Before you can view your website, you'll need to configure it.
Github allows you to change your website 
[online](https://docs.github.com/en/repositories/working-with-files/managing-files/editing-files).
Just open your browser and login to Github.

To customize your website, you'll need to edit the ```ebt-config.mjs``` 
file in your repository.
Once you configure your website properly, you'll be able to view 
it and add your own wiki content.

##E ebt-config.mjs

The file '''ebt-config.mjs''' has several properties you will need to change.
Be sure to use [JSON syntax](https://www.json.org/json-en.html) properly!

| Property | Description |
| :---- | :---- |
| appName | The site name (e.g., ```EBT-Site```). |
| basePath | The URL base path for your site. Initially, this should be the Github repository name (e.g., "/ebt-site3/"). If you choose a custom Internet domain, change this to simply "/".
| content.index | (Optional) The file name for customizing the file name used for category table of contents. The default is "toc".
} footnotes | Title of footnote block or blank
| github.account | The Github account name (e.g., "sc-voice") 
| github.repository | The Github repository name (e.g., "ebt-site3") 
| multilingual | (Optional) The default is ```false```, which allows language selection. If a two-letter language ISO code is specified (e.g., "de"), the users to your site will not have settings to change the web application language or the EBT translation language. The website will be rendered in the language specified.
| privacyPath | URL for privacy page (default is "#/wiki/privacy")

Commit your changes and verify them by viewing your website.

