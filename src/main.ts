interface Point {
    x: number;
    y: number;
}

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
const ctx = canvas.getContext("2d")!;
const output = document.querySelector<HTMLTextAreaElement>("#output")!;

let image: HTMLImageElement | undefined;

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

document.querySelector("#imageUpload")?.addEventListener("change", function (e) {
    const file = (e.target as HTMLInputElement).files?.[0];

    if (!file) return;

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
        y: (y - offsetY) / scale
    };
}

function toScreenCoords(x: number, y: number): Point {
    return {
        x: x * scale + offsetX,
        y: y * scale + offsetY
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
    a.download = "polygon.convexshape";
    a.click();
    URL.revokeObjectURL(url);
});

document.querySelector("#clearBtn")?.addEventListener("click", clearPoints);

function exportConvexShape() {
    if (points.length < 3) {
        alert("Need at least 3 points to make a polygon.");
        return "";
    }

    let text = "shape_type: TYPE_HULL\n";
    let ordered = [...points].reverse();

    // if (polygonArea(ordered) < 0) {
    //     ordered.reverse();
    // }

    // for (const p of ordered) {
    //     text += `data: ${p.x.toFixed(3)}\n`;
    //     text += `data: ${p.y.toFixed(3)}\n`;
    //     text += `data: 0.0\n`;
    // }

    if (!image) return "";

    for (const p of ordered) {
        text += `data: ${(p.x - image.width / 2).toFixed(3)}\n`;
        text += `data: ${(image.height / 2 - p.y).toFixed(3)}\n`;
        text += `data: 0.0\n`;
    }

    return text;
}

// function draw() {
//     ctx.clearRect(0, 0, canvas.width, canvas.height);

//     ctx.save();
//     ctx.setTransform(scale, 0, 0, scale, offsetX, offsetY);

//     if (image) {
//         // ctx.drawImage(image, 0, 0);
//         ctx.drawImage(
//             image,
//             0,
//             0,
//             // image.width,
//             // image.height,
//             // offsetX,
//             // offsetY,
//             // image.width * scale,
//             // image.height * scale
//         );

//         // Calculate the center of the image after applying the zoom and pan
//         const centerX = offsetX + (image.width * scale) / 2;
//         const centerY = offsetY + (image.height * scale) / 2;

//         ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
//         ctx.lineWidth = 1;

//         // Vertical line (center X of the canvas)
//         ctx.beginPath();
//         ctx.moveTo(centerX, 0);
//         ctx.lineTo(centerX, canvas.height);
//         ctx.stroke();

//         // Horizontal line (center Y of the canvas)
//         ctx.beginPath();
//         ctx.moveTo(0, centerY);
//         ctx.lineTo(canvas.width, centerY);
//         ctx.stroke();
//     }

//     if (points.length > 1) {
//         ctx.beginPath();
//         ctx.moveTo(points[0].x, points[0].y);
//         for (let i = 1; i < points.length; i++) {
//             ctx.lineTo(points[i].x, points[i].y);
//         }
//         ctx.closePath();
//         ctx.strokeStyle = "#00f";
//         ctx.lineWidth = 2 / scale;
//         ctx.stroke();
//         ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
//         ctx.fill();
//     }

//     for (let p of points) {
//         ctx.beginPath();
//         ctx.arc(p.x, p.y, 6 / scale, 0, Math.PI * 2);
//         ctx.fillStyle = "#f00";
//         ctx.fill();
//         ctx.lineWidth = 1 / scale;
//         ctx.strokeStyle = "#000";
//         ctx.stroke();
//     }

//     ctx.restore();
// }
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (image) {
        ctx.drawImage(
            image,
            0, 0, image.width, image.height,
            offsetX, offsetY,
            image.width * scale,
            image.height * scale
        );

        const centerX = offsetX + (image.width * scale) / 2;
        const centerY = offsetY + (image.height * scale) / 2;

        // Cross lines go across full canvas, aligned to image center
        ctx.strokeStyle = "rgba(0, 255, 255, 0.5)";
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.moveTo(centerX, 0);
        ctx.lineTo(centerX, canvas.height);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(canvas.width, centerY);
        ctx.stroke();
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
        ctx.strokeStyle = "#00f";
        ctx.stroke();
        ctx.fillStyle = "rgba(0, 0, 255, 0.1)";
        ctx.fill();
    }

    // Draw points in screen coords
    for (let p of points) {
        const sp = toScreenCoords(p.x, p.y);
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, 6, 0, Math.PI * 2); // constant 6px radius
        ctx.fillStyle = "#f00";
        ctx.fill();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "#000";
        ctx.stroke();
    }
}


function distance(p1: Point, p2: Point) {
    return Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);
}

