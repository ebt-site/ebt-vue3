---
title: ebt-config
description: Configure EBT-Site for new repository
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

To customize your website, you'll need to 
[edit](#/wiki/design/edit):

Once you configure your website properly, you'll be able to view 
it and add your own wiki content.

##E ebt-config.mjs

The file '''ebt-config.mjs''' has several properties you will need to change.
Be sure to use [JSON syntax](https://www.json.org/json-en.html) properly!

| Property | Description |
| :---- | :---- |
| appName | The site name (e.g., ```EBT-Site```). |
| basePath | The URL base path for your site. Initially, this should be the Github repository name (e.g., "/ebt-site3/"). If you choose a custom Internet domain, change this to simply "/".
| github.account | The Github account name (e.g., "sc-voice") 
| github.repository | The Github repository name (e.g., "ebt-site3") 
| multilingual | (Optional) The two-letter language ISO code for your site. If specified, the users to your site will not have settings to change the web application language or the EBT translation language.
| content.index | The file namve for customizing the file name used for category table of contents (e.g., "toc")

Commit your changes and verify them by viewing your website.

Thu Jul 13 11:15:29 AM PDT 2023
