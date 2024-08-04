import { Graphics, GraphicsContext } from "pixi.js";

const vertexGraphicsContext = new GraphicsContext();
vertexGraphicsContext.arc(0, 0, 3, 0, Math.PI * 2).fill(0xffffff, 0.8);

export class PolyVertex extends Graphics {
  constructor(public readonly pointIndex: number) {
    super();

    this.context = vertexGraphicsContext;

    this.interactive = true;
  }

  onPointerOver(ctrlKey: boolean) {
    this.tint = ctrlKey ? 0xff0000 : 0x00ff00;
  }

  onPointerOut() {
    this.tint = 0xffffff;
  }
}
