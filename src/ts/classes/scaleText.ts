import * as PIXI from "pixi.js";
import {map} from '../helpers/map';

export class ScaleText {
  public textSpace:PIXI.Text;
  public textGround:PIXI.Text;
  public baseTextSpace:PIXI.Text;
  public baseTextGround:PIXI.Text;
  public containerSpace:PIXI.Container;
  public containerGround:PIXI.Container;
  public container:PIXI.Container;

  // flipped I know... in a big hurry
  private textColor = 0x000000;
  private textColorSpace = 0xFFFFFF;

  constructor(x:number, y: number, text: string) {

    
    let shadow = {
      // dropShadowAlpha: 2, 
      // dropShadow: true,
      // dropShadowColor: 'white',
      // dropShadowBlur: 2,
      // dropShadowDistance: 1
    }


    this.baseTextGround = new PIXI.Text('10', {
      fontFamily: "Arial",
      fontSize: 32,
      fill: this.textColor,
      stroke: this.textColor,
      align: "center",
      ...shadow
    });


     this.textGround = new PIXI.Text(text, {
      fontFamily: "Arial",
      fontSize: 14,
      fill: this.textColor,
      stroke: this.textColor,
      align: "left",
      ...shadow
    });

    this.baseTextSpace = new PIXI.Text('10', {
      fontFamily: "Arial",
      fontSize: 32,
      fill: this.textColorSpace,
      stroke: this.textColorSpace,
      align: "center",
      ...shadow
    });


     this.textSpace = new PIXI.Text(text, {
      fontFamily: "Arial",
      fontSize: 14,
      fill: this.textColorSpace,
      stroke: this.textColorSpace,
      align: "left",
      ...shadow
    });

    this.containerSpace = new PIXI.Container();
    this.containerGround = new PIXI.Container();

    this.containerSpace.addChild(this.baseTextSpace, this.textSpace)
    this.containerGround.addChild(this.baseTextGround, this.textGround)


    this.container = new PIXI.Container();

    this.container.addChild(this.containerGround, this.containerSpace);
    
    this.textGround.x = x + 27;
    this.textGround.y = y;

    this.textSpace.x = x + 27;
    this.textSpace.y = y;

    this.baseTextGround.x = x - 10;
    this.baseTextGround.y = y;

    this.baseTextSpace.x = x - 10;
    this.baseTextSpace.y = y;
  }

  setText (str:string) {
    this.textSpace.text = Number(str).toFixed(1);
    this.textGround.text = Number(str).toFixed(1);
  }

  setColor(scaleExp: number) {

    if(scaleExp > 5) {
      let opacity = map(scaleExp, 5,7, 0.1, 1);

      this.containerSpace.alpha = opacity;
    } else {
      this.containerSpace.alpha = 0.1;
    }

  }
}