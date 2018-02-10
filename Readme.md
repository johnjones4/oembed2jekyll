# Oembed2Jekyll

Converts an RSS feed of Oembed-ready posts into Jekyll posts.

## Installation

```sh
# npm install -g oembed2jekyll
```

## Usage

```sh
# oembed2jekyll [URL] <options>
```

* **URL** RSS feed URL
* **Options**
  * **--title** Key to use when setting the title in frontmatter. Defaults to _title_.
  * **--description** Key to use when setting the description in frontmatter. Defaults to _description_.
  * **--image** Key to use when setting the image in frontmatter. Defaults to _image_.
  * **--layout** Layout value to set in the frontmatter. Defaults to _post_.
  * **--output-dir** Where to output post files. Defaults to _\_posts_.
