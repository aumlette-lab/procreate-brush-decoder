# Procreate Brush Decoder

A model‑driven web viewer for decoding **Procreate brush settings** directly from `.brush` / `.brushset` / `.plist` files.
Built on top of the **Plist Viewer** project, it uses a structured schema (`procreate-brush-decoder-vX.json`) to translate Procreate's raw brush data into human‑readable GUI values.


## Features

* **Schema‑Driven Rendering** — Displays brush panels and settings from a JSON definition (not raw plist keys).
* **Human‑Readable Output** — Decodes numerical and boolean values into GUI‑equivalent sliders, toggles, or modes.
* **Full Brush Layout** — All panels (Stroke Path, Shape, Grain, Rendering, etc.) stacked in a single scrollable view.
* **Dual Brush Comparison** — Upload two brushes, view them individually, or diff their raw/decoded values panel by panel.
* **Safe Formula Evaluation** — Custom sandbox for evaluating math expressions.
* **Extensible Schema** — Supports formulas, multi‑path composites, and logical mappings.

## Getting Started

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

### 4. Load `.brush` files

* Upload one or two Procreate brushes or plist files.
* Use the view toggle to inspect File A, File B, or a side‑by‑side comparison of settings that differ.
* Filter by panel, search across setting names/paths, and export the decoded results.


## Tech Stack

* **Next.js 14** + **TypeScript**
* **Tailwind CSS**
* **plist parser** for macOS property lists
* **Custom formula evaluator** for safe math and logic execution


## License

MIT License — feel free to fork, extend, and adapt.


### Author

**Aumlette (@aumlette-lab)**
Created for exploring and understanding the inner mechanics of Procreate’s brush engine.
