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

### Groups

Assign items to labelled rows using `groups` and `group` on each item:

````markdown
```vis-timeline
groups:
  - id: military
    content: Military
  - id: political
    content: Political
items:
  - content: Battle of Hastings
    start: "1066-10-14"
    group: military
  - content: Norman Conquest
    start: "1066"
    end: "1072"
    group: political
```
````

Nest groups with `nestedGroups` (a list of child group IDs):

````markdown
```vis-timeline
groups:
  - id: europe
    content: Europe
    nestedGroups: [uk, france]
  - id: uk
    content: United Kingdom
  - id: france
    content: France
items:
  - content: Magna Carta
    start: "1215"
    group: uk
```
````

### Background items

Shade a time range behind other items using `type: background`. The `content` field is optional and renders as overlay text on the band. Add `group` to confine the shading to a single row.

````markdown
```vis-timeline
items:
  - start: "1337"
    end: "1453"
    type: background
    className: war
    content: Hundred Years' War

  - content: Battle of Agincourt
    start: "1415-10-25"
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
| `type`      | string | `point`, `box`, `range`, or `background`    |
| `className` | string | CSS class for custom styling                |
| `title`     | string | Tooltip. Auto-generated for BCE items.      |
| `group`     | string | Row grouping — matches a group `id`         |

## Options

| Option        | Type    | Default | Notes                      |
| ------------- | ------- | ------- | -------------------------- |
| `height`      | string  | `75vh`  | Container height           |
| `orientation` | string  | `top`   | `top`, `bottom`, or `both` |
| `stack`       | boolean | `true`  | Stack overlapping items    |
| `zoomMin`     | number  | 10 yrs  | Min zoom window (ms)       |
| `zoomMax`     | number  | 10k yrs | Max zoom window (ms)       |

## Obsidian Bases

The plugin registers a **Timeline** view type for [Obsidian Bases](https://obsidian.md/help/bases) (Obsidian 1.10+). Add a `start` property to your notes, create a `.base` file, and switch to the Timeline view to see all matching notes rendered as an interactive timeline.

Configure which note properties to use via the view options panel:

| Option | Default | Notes |
| --- | --- | --- |
| Start date | `start` | Required. Any supported date format. |
| End date | — | Optional. Makes the item a range. |
| Label | file name | Displayed on the item. |
| Group | — | Optional. Groups items into rows. |

If Bases is not enabled in the vault, the view type registration is silently skipped.

## Roadmap

- **v0.3.0** — Settings panel for global defaults, locale

## License

MIT
