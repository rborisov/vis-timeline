# Medieval Europe — Bases example

Ten notes covering medieval European history (1066–1453), each with `start`, optional `end`, and `group` frontmatter properties. Drop this folder into an Obsidian vault to get a working Bases timeline in two steps.

## What's in this folder

| File | start | end | group |
| --- | --- | --- | --- |
| `battle-of-hastings.md` | 1066-10-14 | — | military |
| `norman-conquest.md` | 1066 | 1072 | political |
| `domesday-book.md` | 1086 | — | political |
| `first-crusade.md` | 1096 | 1099 | military |
| `magna-carta.md` | 1215-06-15 | — | political |
| `hundred-years-war.md` | 1337 | 1453 | military |
| `black-death.md` | 1347 | 1351 | epidemic |
| `battle-of-agincourt.md` | 1415-10-25 | — | military |
| `printing-press.md` | 1440 | — | cultural |
| `fall-of-constantinople.md` | 1453-05-29 | — | military |

## Quick start

### Option A — use the included .base file

1. Copy this entire folder into your vault.
2. Open `medieval-europe.base` in Obsidian — it already filters to notes in the same folder and includes both a Table and a Timeline view.
3. Click **Timeline** in the view selector at the top of the base.
4. Open **View options** (gear icon) and set:
   - **Start date** → `start`
   - **End date** → `end`
   - **Group** → `group`

### Option B — create your own .base file

1. Copy the note files into any folder in your vault.
2. Create a new `.base` file in the same folder (right-click the folder → **New base**).
3. Add a filter so only the note files appear:
   - Property: `file folder` · is · *(leave blank to match the current folder)*

   Or open the `.base` file in a text editor and paste:

   ```
   filters:
     and:
       - "file.folder == this.file.folder"
       - "file.ext == \"md\""
       - "file.path != this.file.path"
       - "start != null"
   ```

4. Click **Add view** → choose **Timeline**.
5. Open **View options** (gear icon) and configure the property mappings:

   | Option | Value |
   | --- | --- |
   | Start date | `start` |
   | End date | `end` |
   | Label | *(leave blank for file name)* |
   | Group | `group` |

## Using this pattern for your own notes

Any note with a `start` property will appear on the timeline. Add `end` to make it a range. Add `group` to assign it to a row. The property names are configurable per-view — you can use whatever frontmatter keys you already have.

```yaml
---
start: 2024-03-15
end: 2024-06-01
group: work
---
```
