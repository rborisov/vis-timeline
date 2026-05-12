# Beatles Era — comprehensive Bases example

20 notes covering the Beatles and the music industry from 1952 to 1970. Designed to demonstrate every frontmatter property the Timeline view supports.

## Features demonstrated

| Feature | How it's used |
| --- | --- |
| Point events | Single `start` date — formations, releases, concerts |
| Range events | `start` + `end` — albums recorded over a period, the British Invasion |
| Groups | `group` field assigns each note to a row |
| Background shading | `type: background` — era bands behind all items |
| Custom tooltip | `title` — every note has a descriptive hover text |
| CSS class | `className: landmark` — milestone events styled differently |

## Notes in this folder

### Background eras (type: background)

| File | start | end | className |
| --- | --- | --- | --- |
| `era-birth-of-rock.md` | 1954 | 1962 | era-rock |
| `era-beatlemania.md` | 1963 | 1966 | era-beatlemania |
| `era-psychedelic.md` | 1966 | 1970 | era-psychedelic |

### Beatles events (group: beatles-event)

| File | start | className |
| --- | --- | --- |
| `beatles-formed.md` | 1960-08 | — |
| `decca-rejection.md` | 1962-01-01 | — |
| `ed-sullivan.md` | 1964-02-09 | landmark |
| `last-concert.md` | 1966-08-29 | — |
| `rooftop-concert.md` | 1969-01-30 | landmark |
| `beatles-breakup.md` | 1970-04-10 | — |

### Beatles albums (group: beatles-album)

| File | start | className |
| --- | --- | --- |
| `please-please-me.md` | 1963-03-22 | — |
| `hard-days-night.md` | 1964-07-10 | — |
| `rubber-soul.md` | 1965-12-03 | — |
| `revolver.md` | 1966-08-05 | landmark |
| `sgt-peppers.md` | 1967-06-01 | landmark |
| `white-album.md` | 1968-11-22 | — |
| `abbey-road.md` | 1969-09-26 | landmark |
| `let-it-be.md` | 1970-05-08 | — |

### Music industry (group: industry)

| File | start | end | className |
| --- | --- | --- | --- |
| `sun-records.md` | 1952 | — | — |
| `motown-founded.md` | 1959 | — | — |
| `rolling-stones-formed.md` | 1962-07 | — | — |
| `british-invasion.md` | 1964 | 1967 | landmark |
| `apple-records.md` | 1968-01 | — | — |
| `woodstock.md` | 1969-08-15 | 1969-08-18 | landmark |

## Quick start

1. Copy this folder into your Obsidian vault.
2. Open `beatles-era.base` — it filters to all `.md` files in the folder with a `start` property.
3. Click **Timeline** in the view selector.
4. Open **View options** (gear icon) and set:

   | Option | Value |
   | --- | --- |
   | Start date | `start` |
   | End date | `end` |
   | Group | `group` |

   Leave **Label** blank — it defaults to the file name.

5. Click any item to open the corresponding note.

## Styling landmark events

Add this snippet to your vault's CSS (Settings → Appearance → CSS snippets) to distinguish landmark items and era backgrounds:

```css
/* Landmark events */
.vis-item.landmark {
  background-color: #7c3aed;
  border-color: #5b21b6;
  color: #fff;
}

/* Era backgrounds */
.vis-item.vis-background.era-rock       { background: rgba(239, 68, 68, 0.08); }
.vis-item.vis-background.era-beatlemania { background: rgba(234, 179, 8, 0.10); }
.vis-item.vis-background.era-psychedelic { background: rgba(139, 92, 246, 0.10); }
```
