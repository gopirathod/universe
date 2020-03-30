import { Item } from "./item";
import { Ring } from "./ring";
import { Entity } from "./entity";
import { E } from "../helpers/e";
import { pad } from "../helpers/pad";
import { map } from "../helpers/map";
import { getScaleText } from "../helpers/getScaleText";
import { Slider } from "./slider";
import * as PIXI from "pixi.js";

// import * as sizes from '../../data/sizes.json';

export class Universe {
  private slider: Slider;
  public app: PIXI.Application;
  public container: PIXI.Container;
  public displayContainer: PIXI.Container;
  public selectedItem: Item;

  private items: Array<Item> = [];
  private rings: Array<Ring> = [];

  private itemCount = 0;

  private currentZoomExp: number = 0;

  constructor(
    startingZoom: number,
    slider: Slider,
    app: PIXI.Application,
    loader: PIXI.Loader
  ) {
    this.currentZoomExp = startingZoom;
    this.container = new PIXI.Container();
    this.displayContainer = new PIXI.Container();

    this.slider = slider;
    this.app = app;

    this.container.sortableChildren = false;

    this.app.renderer.plugins.interaction.on("mousedown", (e: any) => {
      if (!e.target) {
        // if clicked outside of any items
        this.unHideItems();
      }
    });

    document.addEventListener(
      "mousewheel",
      (e: any) => {
        this.unHideItems();
      },
      false
    );

    // center the rings charlez
    this.container.x = this.app.screen.width / 2;
    this.container.y = this.app.screen.height / 2;

    this.container.pivot.x = this.container.width / 2;
    this.container.pivot.y = this.container.height / 2;

    // center the rings charlez for display (HACKY)
    this.displayContainer.x = this.app.screen.width / 2;
    this.displayContainer.y = this.app.screen.height / 2;

    this.displayContainer.pivot.x = this.displayContainer.width / 2;
    this.displayContainer.pivot.y = this.displayContainer.height / 2;
  }

  update(scaleExp: number) {
    for (const ring of this.rings) ring.setZoom(scaleExp);
    for (const item of this.items) item.setZoom(scaleExp);
  }

  onHandleClicked() {
    this.unHideItems();
  }

  unHideItems() {
    for (const item of this.items) item.hideDescription();
    // for (const otherItem of [...this.items, ...this.rings]) {
    //   // hide all other descriptions
    //   otherItem.container.alpha = 1;
    // }

    this.container.filters = null;

    if (this.selectedItem) {
      this.displayContainer.removeChildAt(0);
      this.container.addChild(this.selectedItem.getContainer());
      this.selectedItem = undefined;
    }

    while (this.displayContainer.children[0]) {
      this.displayContainer.removeChildAt(0);
    }

    this.displayContainer.visible = false;
  }

  hideAllItemsBut(item: Item) {
    if (this.selectedItem !== item) {
      if (this.selectedItem) {
        // clear if selectedItem exists
        this.displayContainer.removeChild(this.selectedItem.getContainer());
        while (this.displayContainer.children[0]) {
          this.displayContainer.removeChildAt(0);
        }

        this.container.addChild(this.selectedItem.getContainer());  
      }
      

      item.showDescription();
      this.displayContainer.addChild(item.getContainer());

      this.selectedItem = item;

      // TweenMax.to(this.container, 2, { pixi: { blurFilter: 15 } });
      const filter = new PIXI.filters.BlurFilter(4, 4, 1, 5);

      this.container.filters = [filter];

      this.displayContainer.visible = true;

      for (const otherItem of this.items.filter(x => x !== item)) {
        // hide all other descriptions
        otherItem.hideDescription();
        // otherItem.container.alpha = .5
      }
    } else {
      this.unHideItems()
    }
  }

  itemClicked(item: Item) {
    const percent = map(
      item.scaleExp + Math.log10(item.coeff) + Math.log10(item.realRatio),
      -35,
      27,
      0,
      1
    );

    this.hideAllItemsBut(item);
    // this.container.setChildIndex(item.container, this.items.length + this.rings.length - 2);

    this.slider.setAnimationTargetPercent(percent + 0.003);
  }

  async createItems(textures: any, languageIndex: number, cb: Function) {
    let allFullTextures: any = {};
    for (let key of Object.keys(textures)) {
      if (key.includes("main")) {
        allFullTextures = { ...allFullTextures, ...textures[key].textures };
      }
    }

    const itemSizes = await (await fetch("/data/sizes.json")).json();
    const visualLocations = await (
      await fetch("/data/visualLocations.json")
    ).json();
    const textData = (
      await (await fetch(`/data/languages/l${languageIndex}.txt`)).text()
    ).split("\n");

    // const visualLocations = (await request.get("/data/visualLocations.json").set("accept", "json")).body;
    // const textData = (await request.get(`/data/languages/l${languageIndex}.txt`)).text.split('\n');

    let meterText = textData[596];
    let meterPluralText = textData[597];

    let onClick = (item: Item) => {
      this.itemClicked(item);
    };

    this.itemCount = itemSizes.length;

    for (let idx = 0; idx < itemSizes.length; idx++) {
      cb(idx / itemSizes.length);

      let textDatum = {
        title: "",
        description: ""
      };

      let sizeData = itemSizes[idx];
      let visualLocation = visualLocations[idx];

      const padded = pad(idx + 1, 3);
      const texture = allFullTextures[padded + ""];
      const textureLow = textures.assetsLow.textures[padded + "_quarter"];
      const textureMedium = textures.assetsMedium.textures[padded + "_half"];

      if (idx >= 29) {
        textDatum.title = textData[(idx - 29) * 2];
        textDatum.description = textData[(idx - 29) * 2 + 1];

        let item = new Item(
          sizeData,
          [texture, textureLow, textureMedium],
          visualLocation,
          textDatum,
          onClick
        );
        this.items.push(item);
        this.container.addChild(item.getContainer());
      } else if (idx < 17) {
        let prefix = textData[idx + 602] || "";
        idx !== 16 ? prefix = prefix.substring(0, prefix.length - 1) : ''; //remove new line

        textDatum.title = "1 " + prefix + meterText;
        textDatum.description = getScaleText(sizeData.exponent) + " m";

        let ring = new Ring(
          idx,
          sizeData,
          [texture, textureLow, textureMedium],
          visualLocation,
          textDatum
        );
        this.rings.push(ring);
        this.container.addChild(ring.getContainer());
      } else {
        // let prefix = textData[idx+602] || '';
        // prefix = prefix.substring(0, prefix.length-1) //remove new line

        let val;
        let unitPrefix = textData[602];
        if (idx <= 26) {
          val = E(idx - 27)
            .toFixed(15)
            .replace(/\.?0+$/, "");
        } else {
          val = E(idx - 26)
            .toFixed(15)
            .replace(/\.?0+$/, "");
        }

        if (val === "100") {
          unitPrefix = textData[605];
        }

        unitPrefix = unitPrefix.substring(0, unitPrefix.length - 1);

        textDatum.title = "";

        const yoctoVal = getScaleText(sizeData.exponent + 24);
        textDatum.description =
          yoctoVal +
          " " +
          textData[602].substring(0, textData[602].length - 1) +
          textData[597] +
          " ";
        console.log(textData[602]);

        if (idx === 28) {
          const femptoVal = getScaleText(sizeData.exponent + 15);
          textDatum.description =
            femptoVal +
            " " +
            textData[605].substring(0, textData[602].length - 1) +
            textData[597];
        }

        let ring = new Ring(
          idx,
          sizeData,
          [texture, textureLow, textureMedium],
          visualLocation,
          textDatum
        );
        this.rings.push(ring);
        this.container.addChild(ring.getContainer());
      }
    }
  }
}