import "./style.css";
import {
  Application,
  Container,
  Graphics,
  ImageSource,
  Polygon,
  Rectangle,
  Sprite,
  Text,
  Texture,
} from "pixi.js";
import { PolyVertex } from "./PolyVertex.ts";
import { Button } from "./Button.ts";
import { getClosestEdge } from "./Utility.ts";

export async function start() {
  const app = new Application();

  const view: HTMLCanvasElement = document.getElementById(
    "app",
  )! as HTMLCanvasElement;

  await app.init({
    autoStart: true,
    resizeTo: view,
    view,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
    antialias: true,
  });

  app.renderer.on("resize", () => {
    mainContainer.position.set(app.screen.width / 2, app.screen.height / 2);
    app.stage.hitArea = new Rectangle(
      0,
      0,
      app.screen.width,
      app.screen.height,
    );
    instructionsText.position.set(app.screen.width - 10, 10);
    imageTitleText.position.set(app.screen.width / 2, app.screen.height - 10);
  });

  const mainContainer = new Container();
  app.stage.addChild(mainContainer);

  const mainSprite = new Sprite();
  mainSprite.anchor.set(0.5);
  mainContainer.addChild(mainSprite);

  const polygonGraphics = new Graphics();
  mainContainer.addChild(polygonGraphics);

  const vertexContainer = new Container<PolyVertex>();
  mainContainer.addChild(vertexContainer);

  const mainPolygon = new Polygon();

  let dragTarget: PolyVertex | null = null;
  let currentTarget: PolyVertex | null = null;

  app.stage.addChild(
    new Button("Clear Polygon", 10, 10, () => {
      mainPolygon.points = [];
      drawVertices();
      drawPolygon();

      // Clear the `mainPolygon` from localStorage:
      localStorage.removeItem("mainPolygonPoints");
    }),
  );

  app.stage.addChild(
    new Button("Log Polygon (console)", 10, 50, () => {
      const offset = [mainSprite.width / 2, mainSprite.height / 2];
      console.log(
        JSON.stringify(
          mainPolygon.points.map((point, i) =>
            Math.round(point + offset[i % 2]),
          ),
        ),
      );
    }),
  );

  const imageTitleText = new Text({
    text: "no image",
    style: {
      fill: 0xffffff,
      align: "center",
      fontSize: 20,
    },
  });
  imageTitleText.anchor.set(0.5, 1);
  app.stage.addChild(imageTitleText);

  const instructionsText = new Text({
    text: `Drag and drop an image to preview
  Click to add a vertex
  Ctrl + Click to remove a vertex
  Scrollwheel to zoom in/out`,
    style: {
      fill: 0xffffff,
      align: "right",
      fontSize: 20,
    },
  });

  instructionsText.anchor.set(1, 0);
  app.stage.addChild(instructionsText);

  app.stage.interactive = true;

  const stopDrag = () => {
    dragTarget = null;

    // Cache the `mainPolygon` in localStorage:
    localStorage.setItem(
      "mainPolygonPoints",
      JSON.stringify(mainPolygon.points),
    );
  };

  app.stage.on("pointerup", stopDrag);
  app.stage.on("pointerupoutside", stopDrag);

  app.stage.on("pointerdown", (e) => {
    if (e.target instanceof PolyVertex) {
      if (ctrlKey) {
        // Remove the vertex:
        const polyVertex = e.target;
        const index = polyVertex.pointIndex;
        mainPolygon.points.splice(index, 2);
        drawVertices();
        drawPolygon();

        return;
      }

      dragTarget = e.target;
      return;
    }

    const local = mainSprite.toLocal(e.global);

    const spliceIndex =
      mainPolygon.points.length > 2
        ? getClosestEdge(mainPolygon.points, local.x, local.y) + 2
        : mainPolygon.points.length;

    // Insert a new vertex after the closest edge:
    mainPolygon.points.splice(spliceIndex, 0, local.x, local.y);

    drawVertices();
    drawPolygon();

    const newPolyVertex = vertexContainer.children.find(
      (polyVertex) => polyVertex.pointIndex === spliceIndex,
    );

    if (newPolyVertex !== undefined) {
      dragTarget = newPolyVertex;
    }

    // Cache the `mainPolygon` in localStorage:
    localStorage.setItem(
      "mainPolygonPoints",
      JSON.stringify(mainPolygon.points),
    );
  });

  app.stage.on("pointermove", (e) => {
    if (dragTarget !== null) {
      const newPosition = dragTarget.parent.toLocal(e.global);
      dragTarget.x = newPosition.x;
      dragTarget.y = newPosition.y;

      mainPolygon.points[dragTarget.pointIndex] = dragTarget.x;
      mainPolygon.points[dragTarget.pointIndex + 1] = dragTarget.y;
    }

    drawPolygon();
  });

  let ctrlKey = false;
  window.addEventListener("keydown", (e) => {
    ctrlKey = e.ctrlKey;

    if (currentTarget !== null) {
      currentTarget.onPointerOver(ctrlKey);
    }
  });
  window.addEventListener("keyup", (e) => {
    ctrlKey = e.ctrlKey;

    if (currentTarget !== null) {
      currentTarget.onPointerOver(ctrlKey);
    }
  });

  function drawVertices() {
    for (const polyVertex of vertexContainer.children) {
      polyVertex.destroy();
    }

    vertexContainer.removeChildren();

    for (let i = 0; i < mainPolygon.points.length; i += 2) {
      const x = mainPolygon.points[i];
      const y = mainPolygon.points[i + 1];

      const polyVertex = new PolyVertex(i);
      polyVertex.on("pointerover", () => {
        polyVertex.onPointerOver(ctrlKey);
        currentTarget = polyVertex;
      });
      polyVertex.on("pointerout", () => {
        polyVertex.onPointerOut();
        if (currentTarget === polyVertex) {
          currentTarget = null;
        }
      });

      polyVertex.position.set(x, y);

      vertexContainer.addChild(polyVertex);
    }
  }

  function drawPolygon() {
    polygonGraphics.clear();

    for (let i = 0; i < mainPolygon.points.length; i += 2) {
      const x = mainPolygon.points[i];
      const y = mainPolygon.points[i + 1];

      if (i === 0) {
        polygonGraphics.moveTo(x, y);
      } else {
        polygonGraphics.lineTo(x, y);
      }
    }

    polygonGraphics.closePath();
    polygonGraphics.stroke(0xffffff);
  }

  // Listen for scrollwheel to zoom in and out.
  window.addEventListener("wheel", (e) => {
    const delta = e.deltaY;
    const zoom = 0.1;

    if (delta > 0) {
      mainContainer.scale.x -= zoom;
      mainContainer.scale.y -= zoom;
    } else {
      mainContainer.scale.x += zoom;
      mainContainer.scale.y += zoom;
    }

    // Cache the `mainContainer.scale` in localStorage:
    localStorage.setItem(
      "mainContainerScale",
      JSON.stringify({ x: mainContainer.scale.x, y: mainContainer.scale.y }),
    );
  });

  function onDragEnter(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function onDragOver(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function onDragLeave(e: DragEvent) {
    e.stopPropagation();
    e.preventDefault();
  }

  function onDrop(e: DragEvent) {
    if (e.dataTransfer === null) {
      console.error("e.dataTransfer is null");
      return;
    }
    e.stopPropagation();
    e.preventDefault();
    setFiles(e.dataTransfer.files);
    return false;
  }

  view.addEventListener("dragenter", onDragEnter, false);
  view.addEventListener("dragover", onDragOver, false);
  view.addEventListener("dragleave", onDragLeave, false);
  view.addEventListener("drop", onDrop, false);

  function loadTexture(fileName: string, imageData: string) {
    const image = new Image();

    image.onload = function () {
      const source = new ImageSource({
        resource: image,
      });

      mainSprite.texture = new Texture({
        source,
      });

      imageTitleText.text = fileName;

      // mainSprite.anchor.set(0.5);
    };

    image.src = imageData;

    // Cache the `imageData` and `fileName` in localStorage:
    localStorage.setItem("imageData", imageData);
    localStorage.setItem("fileName", fileName);
  }

  function setFiles(files: FileList) {
    const file = files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
      if (e.target === null) {
        console.error("e.target is null");
        return;
      }

      const imageData = e.target.result as string;
      loadTexture(file.name, imageData);
    };
    reader.readAsDataURL(file);
  }

  // Load cached data from localStorage:

  const imageData = localStorage.getItem("imageData");
  const fileName = localStorage.getItem("fileName");
  if (imageData !== null && fileName !== null) {
    loadTexture(fileName, imageData);
  }

  const mainPolygonPointsString = localStorage.getItem("mainPolygonPoints");
  if (mainPolygonPointsString !== null) {
    mainPolygon.points = JSON.parse(mainPolygonPointsString);
  }

  const mainContainerScaleString = localStorage.getItem("mainContainerScale");
  if (mainContainerScaleString !== null) {
    const mainContainerScale = JSON.parse(mainContainerScaleString);
    mainContainer.scale.set(mainContainerScale.x, mainContainerScale.y);
  }

  drawVertices();
  drawPolygon();

  app.renderer.resize(view.clientWidth, view.clientHeight);
}
