# 🖌️ Procreate Brush Decoder

A model‑driven web viewer for decoding **Procreate brush settings** directly from `.brush` / `.brushset` / `.plist` files.
Built on top of the **Plist Viewer** project, it uses a structured schema (`procreate-brush-decoder-vX.json`) to translate Procreate's raw brush data into human‑readable GUI values.

---

## ✨ Features

* **Schema‑Driven Rendering** — Displays brush panels and settings from a JSON definition (not raw plist keys).
* **Human‑Readable Output** — Decodes numerical and boolean values into GUI‑equivalent sliders, toggles, or modes.
* **Full Brush Layout** — All panels (Stroke Path, Shape, Grain, Rendering, etc.) stacked in a single scrollable view.
* **Two‑Column View** — Compare *Raw* and *Decoded* values side by side.
* **Safe Formula Evaluation** — Custom sandbox for evaluating math expressions.
* **Extensible Schema** — Supports formulas, multi‑path composites, and logical mappings.

---

## 🧩 How It Works

1. **Parse**: The app loads and parses a Procreate `.brush` or `.plist` file.
2. **Map**: Each key is matched against entries in `procreate-brush-decoder-vX.json`.
3. **Decode**: The formula (string or object mapping) is evaluated to compute GUI‑friendly values.
4. **Render**: Panels and settings are displayed in a clean, scrollable interface.

### Example

```json
{
  "panel": "Shape",
  "setting": "Input Style",
  "paths": ["$top.root.shapeAzimuth", "$top.root.shapeRoll"],
  "data_type": "bool",
  "formula": {
    "Touch Only": [false, false],
    "Azimuth": [true, false],
    "Azimuth and Rolling": [true, true]
  }
}
```

→ produces:

| Setting     | Raw Values      | Decoded   |
| ----------- | --------------- | --------- |
| Input Style | `[true, false]` | `Azimuth` |

---

## 🧱 Project Structure

```
/src
  /app
    page.tsx                # main entry
  /components
    BrushDecoder.tsx        # schema-driven renderer
    PanelView.tsx           # panel section (e.g. Shape, Grain)
    SettingRow.tsx          # individual setting row
    Toolbar.tsx             # toggle Raw/Decoded view, filter, search
  /data
    procreate-brush-decoder-vX.json
  /lib
    decodeEngine.ts         # core decoding logic
    expr.ts                 # safe math evaluator
    plist.ts                # path-based value extractor
  /types
    schema.d.ts             # schema definition
```

---

## 🧠 Decoding Engine Overview

The decoding logic (`/lib/decodeEngine.ts`) supports two formula types:

1. **Math formulas** — strings like `"round(raw*100)"` or `"clamp(raw[0]-raw[1],0,1)"`
2. **Logical mappings** — objects mapping GUI labels to arrays of raw values

All formulas are evaluated in a sandboxed environment (`/lib/expr.ts`) supporting functions like `round()`, `sqrt()`, `abs()`, and `clamp()`.

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/aumlette-lab/procreate-brush-decoder.git
cd procreate-brush-decoder
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run locally

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000).

### 4. Load a `.brush` file

* Upload a Procreate brush or plist file.
* The viewer will decode and display its settings.

---

## 🧮 Supported Formula Syntax

| Expression          | Description                      |
| ------------------- | -------------------------------- |
| `round(raw*100)`    | Converts float (0–1) to percent  |
| `sqrt(raw)`         | Square root transformation       |
| `clamp(raw,0,1)`    | Constrains value between 0 and 1 |
| `raw[0]` / `raw[1]` | Access multi‑path inputs         |

---

## 🧪 Example Panels

| Panel       | Settings (examples)               |
| ----------- | --------------------------------- |
| Stroke Path | Spacing, Jitter, Falloff          |
| Shape       | Input Style, Roundness, Filtering |
| Grain       | Blend Mode, Movement, Scale       |
| Rendering   | Rendering Mode, Flow, Glaze       |

---

## 🧰 Tech Stack

* **Next.js 14** + **TypeScript**
* **Tailwind CSS**
* **plist parser** for macOS property lists
* **Custom formula evaluator** for safe math and logic execution

---

## 📄 License

MIT License — feel free to fork, extend, and adapt.

---

## 🧭 Roadmap

* [ ] Curve visualisation for pressure graphs
* [ ] Reverse decoding (GUI → raw)
* [ ] Export decoded brushes as CSV/JSON
* [ ] Tooltip descriptions from `notes`

---

### Author

**Aumlette (@aumlette-lab)**
Created for exploring and understanding the inner mechanics of Procreate’s brush engine.
