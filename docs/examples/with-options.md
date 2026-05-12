# Per-block options

## YAML

```vis-timeline
options:
  height: 400px
  orientation: bottom
  stack: false
  zoomMin: 315360000000
  zoomMax: 31536000000000

items:
  - content: Hundred Years' War
    start: "1337"
    end: "1453"
    type: range

  - content: Black Death
    start: "1347"
    end: "1351"
    type: range
    className: epidemic

  - content: Battle of Agincourt
    start: "1415-10-25"
    type: point
```

## JSON

```vis-timeline
{
  "options": {
    "height": "400px",
    "orientation": "bottom",
    "stack": false,
    "zoomMin": 315360000000,
    "zoomMax": 31536000000000
  },
  "items": [
    { "content": "Hundred Years' War", "start": "1337", "end": "1453", "type": "range" },
    { "content": "Black Death", "start": "1347", "end": "1351", "type": "range", "className": "epidemic" },
    { "content": "Battle of Agincourt", "start": "1415-10-25", "type": "point" }
  ]
}
```
