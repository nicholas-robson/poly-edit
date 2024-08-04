import {
  Container,
  FederatedPointerEvent,
  Sprite,
  Text,
  Texture,
} from "pixi.js";

export class Button extends Container {
  constructor(
    label: string,
    x: number,
    y: number,
    private onClick: () => void,
  ) {
    super();

    const background = new Sprite(Texture.WHITE);
    const text = new Text({
      text: label,
      style: {
        fill: 0x000000,
        fontSize: 20,
      },
    });

    background.anchor.set(0);
    text.anchor.set(0);

    this.addChild(background);
    this.addChild(text);

    background.width = text.width + 20;
    background.height = text.height + 10;

    text.position.set(10, 5);

    this.position.set(x, y);

    this.interactive = true;
    this.on("pointerdown", this.onPointerDown);
    this.on("pointertap", this.onPointerTap);
  }

  onPointerDown(e: FederatedPointerEvent) {
    e.stopPropagation();
  }

  onPointerTap(e: FederatedPointerEvent) {
    e.stopPropagation();
    this.onClick();
  }
}
