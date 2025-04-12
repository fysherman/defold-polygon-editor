# 🧩 Polygon Creator for Defold

This is a simple tool that allows you to create convex polygon shapes for [Defold Engine](https://defold.com/).  
It helps you draw polygons directly over an image, and export them in the `.convexshape` format that Defold uses.

---

## 🚀 Features

- ✅ Import overlay image (PNG, JPG, etc.)
- 🖱️ Left-click to add points
- ✏️ Drag points to adjust shape
- 🗑️ Right-click on a point to delete
- 🔍 Scroll to zoom in/out (with zoom centered at cursor)
- 💾 Export shape data in `TYPE_HULL` format
- ⬇️ Download exported file as `.convexshape`

---

## 📦 [Getting Started](https://fysherman.github.io/defold-polygon-editor/)

---

## 🖼️ How to Use

1. **Upload Image:** Click on the image upload field to select your overlay image.
2. **Add Points:** Left-click to add vertices of the polygon.
3. **Move Points:** Drag a point to reposition it.
4. **Remove Point:** Right-click on a point to delete it.
5. **Export:**  
   - Click **"Export as .convexshape Format"** to see the shape text.  
   - Click **"Download .convexshape"** to save it as a file.
6. **Reset:** Use **"Clear Points"** to start over.

---

## 🔎 Output Example

```text
shape_type: TYPE_HULL
data: 100.000
data: 200.000
data: 0.0
data: 150.000
data: 250.000
data: 0.0
data: 120.000
data: 300.000
data: 0.0
