interface Point {
  x: number;
  y: number;
}

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const output = document.querySelector<HTMLTextAreaElement>("#output")!;

let image: HTMLImageElement | undefined;
let fileName = "your_convexshape";

let points: Point[] = [];
let draggingPoint: number | null = null;

// Zoom & Pan
let scale = 1;
let offsetX = 0;
let offsetY = 0;

function clearPoints() {
  points = [];
  draw();
  output.value = "";
}

document
  .querySelector("#imageUpload")
  ?.addEventListener("change", function (e) {
    const file = (e.target as HTMLInputElement).files?.[0];

    if (!file) return;

    fileName = file.name
      .split(".")
      .filter((_, i, arr) => i !== arr.length - 1)
      .join(".");

    const reader = new FileReader();
    reader.onload = function (event) {
      image = new Image();

      image.onload = () => {
        if (!image) return;
        // Auto fit image to canvas
        const scaleX = canvas.width / image.width;
        const scaleY = canvas.height / image.height;
        scale = Math.min(scaleX, scaleY);

        // Center the image
        offsetX = (canvas.width - image.width * scale) / 2;
        offsetY = (canvas.height - image.height * scale) / 2;

        draw();
      };

      if (typeof event.target?.result === "string") {
        image.src = event.target.result;
      }
    };
    reader.readAsDataURL(file);

    clearPoints();
  });

function toCanvasCoords(x: number, y: number): Point {
  return {
    x: (x - offsetX) / scale,
    y: (y - offsetY) / scale,
  };
}

function toScreenCoords(x: number, y: number): Point {
  return {
    x: x * scale + offsetX,
    y: y * scale + offsetY,
  };
}

canvas.addEventListener("mousedown", function (e) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const pos = toCanvasCoords(mouseX, mouseY);

  for (let i = 0; i < points.length; i++) {
    const screenPoint = toScreenCoords(points[i].x, points[i].y);
    if (distance(screenPoint, { x: mouseX, y: mouseY }) < 10) {
      draggingPoint = i;
      return;
    }
  }

  points.push({ x: pos.x, y: pos.y });
  draw();
});

canvas.addEventListener("mousemove", function (e) {
  if (draggingPoint === null) return;
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const pos = toCanvasCoords(mouseX, mouseY);
  points[draggingPoint].x = pos.x;
  points[draggingPoint].y = pos.y;
  draw();
});

canvas.addEventListener("mouseup", () => (draggingPoint = null));

canvas.addEventListener("mouseleave", () => (draggingPoint = null));

canvas.addEventListener("wheel", function (e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  const zoom = e.deltaY < 0 ? 1.1 : 0.9;
  const wx = (mouseX - offsetX) / scale;
  const wy = (mouseY - offsetY) / scale;

  scale *= zoom;
  offsetX = mouseX - wx * scale;
  offsetY = mouseY - wy * scale;
  draw();
});

canvas.addEventListener("contextmenu", function (e) {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;

  for (let i = 0; i < points.length; i++) {
    const screenPoint = toScreenCoords(points[i].x, points[i].y);
    if (distance(screenPoint, { x: mouseX, y: mouseY }) < 10) {
      points.splice(i, 1);
      draw();
      return;
    }
  }
});

document.querySelector("#exportBtn")?.addEventListener("click", function () {
  output.value = exportConvexShape();
});

document.querySelector("#downloadBtn")?.addEventListener("click", function () {
  const text = exportConvexShape();
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${fileName}.convexshape`;
  a.click();
  URL.revokeObjectURL(url);
});

document.querySelector("#clearBtn")?.addEventListener("click", clearPoints);

function exportConvexShape(): string {
  if (!image) {
    window.alert("No image loaded");
    return "";
  }
  if (points.length < 3) {
    window.alert("At least 3 points are required to create a convex shape");
    return "";
  }

  const imageCenter = {
    x: image.width / 2,
    y: image.height / 2,
  };
  const parsedPoints = points.map((p) => ({
    x: p.x - imageCenter.x,
    y: imageCenter.y - p.y, // Because canvas y is top-down while Defold y is bottom-up
  }));

  // Get centroid of the points
  const centroid = parsedPoints.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  centroid.x /= parsedPoints.length;
  centroid.y /= parsedPoints.length;

  // Sort points by counterclockwise angle from centroid
  const sortedPoints = parsedPoints
    .map((p) => ({
      point: p,
      angle: Math.atan2(p.y - centroid.y, p.x - centroid.x),
    }))
    .sort((a, b) => a.angle - b.angle)
    .map((entry) => entry.point);

  const lines = ["shape_type: TYPE_HULL"];

  // Map points to the format required by the convex shape
  for (const p of sortedPoints) {
    lines.push(`data: ${p.x.toFixed(3)}`);
    lines.push(`data: ${p.y.toFixed(3)}`);
    lines.push(`data: 0.0`);
  }

  return lines.join("\n");
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  if (image) {
    const centerX = offsetX + (image.width * scale) / 2;
    const centerY = offsetY + (image.height * scale) / 2;

    // Cross lines go across full canvas, aligned to image center
    ctx.strokeStyle = "#EEEEEE70";
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, canvas.height);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(canvas.width, centerY);
    ctx.stroke();

    ctx.drawImage(
      image,
      0,
      0,
      image.width,
      image.height,
      offsetX,
      offsetY,
      image.width * scale,
      image.height * scale
    );
  }

  // Draw polygon in screen coords
  if (points.length > 1) {
    ctx.beginPath();
    const p0 = toScreenCoords(points[0].x, points[0].y);
    ctx.moveTo(p0.x, p0.y);

    for (let i = 1; i < points.length; i++) {
      const pi = toScreenCoords(points[i].x, points[i].y);
      ctx.lineTo(pi.x, pi.y);
    }
    ctx.closePath();

    ctx.lineWidth = 2; // constant thickness
    ctx.strokeStyle = "#FFB433";
    ctx.stroke();
    ctx.fillStyle = "#FFB43330";
    ctx.fill();
  }

  // Draw points in screen coords
  for (let p of points) {
    const sp = toScreenCoords(p.x, p.y);
    ctx.beginPath();
    ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2); // constant 6px radius
    ctx.fillStyle = "#FFB433";
    ctx.fill();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#FFB433";
    ctx.stroke();
  }
}

function distance(p1: Point, p2: Point) {
  return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}
