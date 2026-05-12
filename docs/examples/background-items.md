# Background items

Background items shade a time range behind other items. Use `type: background` with a `start` and optional `end`. Add `className` for custom colouring, or `group` to shade only one row.

## YAML — full-height bands

```vis-timeline
options:
  height: 300px

items:
  - start: "1337"
    end: "1453"
    type: background
    className: war
    content: Hundred Years' War

  - start: "1347"
    end: "1351"
    type: background
    className: epidemic
    content: Black Death

  - content: Battle of Agincourt
    start: "1415-10-25"

  - content: Fall of Constantinople
    start: "1453-05-29"
```

## YAML — per-group bands

```vis-timeline
groups:
  - id: military
    content: Military
  - id: political
    content: Political

items:
  - start: "1337"
    end: "1453"
    type: background
    group: military
    className: war

  - content: Battle of Agincourt
    start: "1415-10-25"
    group: military

  - content: Magna Carta
    start: "1215"
    group: political

  - content: Domesday Book
    start: "1086"
    group: political
```

## JSON — full-height bands

```vis-timeline
{
  "items": [
    { "start": "1337", "end": "1453", "type": "background", "className": "war", "content": "Hundred Years' War" },
    { "start": "1347", "end": "1351", "type": "background", "className": "epidemic", "content": "Black Death" },
    { "content": "Battle of Agincourt", "start": "1415-10-25" },
    { "content": "Fall of Constantinople", "start": "1453-05-29" }
  ]
}
```
