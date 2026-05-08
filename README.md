# Timeline (vis-timeline)

An [Obsidian](https://obsidian.md) plugin for rendering interactive timelines in your notes. Powered by [vis-timeline](https://visjs.github.io/vis-timeline/). Supports historical BCE/CE dates and YAML authoring.

## Installation

### BRAT (early access)

1. Install the [BRAT](https://github.com/TfTHacker/obsidian42-brat) plugin.
2. Run **BRAT: Add a beta plugin** and enter `rborisov/vis-timeline`.

### Community plugins

Coming soon — submission pending review.

## Usage

Add a `vis-timeline` code block to any note:

````markdown
```vis-timeline
- content: Battle of Hastings
  start: "1066-10-14"
- content: Roman Empire
  start: "-27"
  end: "476"
- content: Bronze Age
  start: "3300 BCE"
  end: "1200 BCE"
```
````

### Per-block options

````markdown
```vis-timeline
options:
  height: 400px
  orientation: bottom
  stack: false
items:
  - content: Battle of Marathon
    start: "-490-09-12"
```
````

## Date formats

| Input              | Meaning            |
| ------------------ | ------------------ |
| `"1066-10-14"`     | 14 Oct 1066 CE     |
| `"1066"`           | 1 Jan 1066 CE      |
| `"-490-09-12"`     | 12 Sep 490 BCE     |
| `"-490"`           | 1 Jan 490 BCE      |
| `"490-09-12 BCE"`  | 12 Sep 490 BCE     |
| `"490 BCE"`        | 1 Jan 490 BCE      |

> **Note:** Year 0 does not exist in historical notation. Use `-1` for 1 BCE and `1` for 1 CE.

CE dates are passed directly to vis-timeline. BCE dates are converted internally to JavaScript `Date` objects, working around moment.js's lack of negative-year support.

## Item fields

| Field       | Type   | Notes                                       |
| ----------- | ------ | ------------------------------------------- |
| `content`   | string | Label shown on the item                     |
| `start`     | string | Required. CE or BCE date string.            |
| `end`       | string | Optional. Makes the item a range.           |
| `type`      | string | `point`, `box`, or `range`                  |
| `className` | string | CSS class for custom styling                |
| `title`     | string | Tooltip. Auto-generated for BCE items.      |
| `group`     | string | Row grouping — available in v0.2.0          |

## Options

| Option        | Type    | Default | Notes                      |
| ------------- | ------- | ------- | -------------------------- |
| `height`      | string  | `75vh`  | Container height           |
| `orientation` | string  | `top`   | `top`, `bottom`, or `both` |
| `stack`       | boolean | `true`  | Stack overlapping items    |
| `zoomMin`     | number  | 10 yrs  | Min zoom window (ms)       |
| `zoomMax`     | number  | 10k yrs | Max zoom window (ms)       |

## Roadmap

- **v0.2.0** — Settings panel for global defaults, groups/subgroups, background items, locale

## License

MIT
