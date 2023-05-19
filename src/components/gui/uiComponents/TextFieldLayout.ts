/// <summary>
///   <para>Where the anchor of the text is placed.</para>
/// </summary>

import { fonts } from "../../../assets/Fonts";
import { FontInfo } from "../../../loader/parser/FontParser";
import { GUIQuad } from "../core/GUIQuad";
import { UITextField } from "./UITextField";
import { UITransform } from "./UITransform";

export enum TextAnchor {
  /// <summary>
  ///   <para>Text is anchored in upper left corner.</para>
  /// </summary>
  UpperLeft,
  /// <summary>
  ///   <para>Text is anchored in upper side, centered horizontally.</para>
  /// </summary>
  UpperCenter,
  /// <summary>
  ///   <para>Text is anchored in upper right corner.</para>
  /// </summary>
  UpperRight,
  /// <summary>
  ///   <para>Text is anchored in left side, centered vertically.</para>
  /// </summary>
  MiddleLeft,
  /// <summary>
  ///   <para>Text is centered both horizontally and vertically.</para>
  /// </summary>
  MiddleCenter,
  /// <summary>
  ///   <para>Text is anchored in right side, centered vertically.</para>
  /// </summary>
  MiddleRight,
  /// <summary>
  ///   <para>Text is anchored in lower left corner.</para>
  /// </summary>
  LowerLeft,
  /// <summary>
  ///   <para>Text is anchored in lower side, centered horizontally.</para>
  /// </summary>
  LowerCenter,
  /// <summary>
  ///   <para>Text is anchored in lower right corner.</para>
  /// </summary>
  LowerRight,
}

export enum Vertical {
  Upper,
  Middle,
  Lower,
}

export enum Horizontal {
  Left,
  Center,
  Right,
}

export class TextFieldLine {
  public charList: string[] = [];
  public quadList: GUIQuad[] = [];
  public width: number = 0;
  public index: number = 0;
}

export class TextFieldLayout {

  public layout(target: UITextField): TextFieldLine[] {
    let lineList: TextFieldLine[] = [];

    let originSize = target.originSize;
    let fontData = fonts.getFontData(target.font, originSize);
    let realSize = target.fontSize / originSize;

    this.makeTextLine(target.uiTransform, target.alignment, lineList, target.font, fontData, target.text, realSize, originSize, target.lineSpacing);
    return lineList;
  }

  private makeTextLine(
    transform: UITransform,
    alignment: TextAnchor,
    lineList: TextFieldLine[],
    fontName: string,
    fontData: FontInfo,
    text: string,
    realSize: number,
    originSize: number,
    lineSpacing: number,
  ): void {
    let curLineIndex: number = -1;
    let offsetX = 0;

    let unitSize = originSize * realSize;
    let halfUnitSize = unitSize * 0.5;
    let maxTextWidthReal = transform.width / realSize;
    let maxTextHeightReal = transform.height / realSize;

    let transformScaleX = 1 / transform.width;
    let transformScaleY = 1 / transform.height;
    let transformOffsetX = 0;
    let transformOffsetY = transform.height;

    //new line
    let makeLine = (): TextFieldLine => {
      offsetX = 0;
      curLineIndex++;
      let line: TextFieldLine = new TextFieldLine();
      line.index = curLineIndex;
      lineList.push(line);
      return line;
    };

    //make quad by char code
    let makeQuad = (char: string, line: TextFieldLine): GUIQuad => {
      const code = char.charCodeAt(0).toString();
      let charSprite = fonts.getFnt(fontName, originSize, code);
      let quad: GUIQuad = null;
      if (charSprite) {
        quad = GUIQuad.quadPool.getOne(GUIQuad);
        quad.sprite = charSprite;
        quad.x = (offsetX + charSprite.xoffset) * realSize - transformOffsetX;
        quad.y = (fontData.base - charSprite.height - charSprite.yoffset - fontData.base) * realSize + transformOffsetY;
        quad.width = charSprite.offsetSize.width * realSize * transformScaleX;
        quad.height = charSprite.offsetSize.height * realSize * transformScaleY;
        offsetX += charSprite.xadvance;
      } else {
        if (char == '\n') {
        } else if (char == '\t') {
          offsetX += unitSize;
        } else {
          offsetX += halfUnitSize;
        }
      }
      line.width = offsetX;
      line.quadList.push(quad);
      line.charList.push(char);
      return quad;
    };

    //alignment
    let alignTextLine = (): void => {
      let tuple = this.getAlignment(alignment);

      switch (tuple.v) {
        case Vertical.Upper:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            if (i > 0) {
              let lineOffsetY = i * unitSize * lineSpacing;
              for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
                let quad = line.quadList[j];
                if (quad) {
                  quad.y -= lineOffsetY;
                }
              }
            }
          }
          break;
        case Vertical.Middle:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetY = (maxTextHeightReal - countI * originSize * lineSpacing) * 0.5 * realSize + i * unitSize * lineSpacing;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.y -= lineOffsetY;
              }
            }
          }
          break;
        case Vertical.Lower:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetY = (maxTextHeightReal - countI * originSize * lineSpacing) * realSize + i * unitSize * lineSpacing;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.y -= lineOffsetY;
              }
            }
          }
          break;
      }

      switch (tuple.h) {
        case Horizontal.Left:
          break;
        case Horizontal.Center:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetX = (maxTextWidthReal - line.width) * 0.5 * realSize;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.x += lineOffsetX;
              }
            }
          }
          break;
        case Horizontal.Right:
          for (let i: number = 0, countI = lineList.length; i < countI; i++) {
            let line = lineList[i];
            let lineOffsetX = (maxTextWidthReal - line.width) * realSize;
            for (let j: number = 0, countJ = line.quadList.length; j < countJ; j++) {
              let quad = line.quadList[j];
              if (quad) {
                quad.x += lineOffsetX;
              }
            }
          }
          break;
      }
    };

    //Parse text
    let parseText = (): void => {
      let curLine: TextFieldLine = null;
      let totalLength: number = text.length;
      let autoWrap = false;
      for (let i = 0; i < totalLength; i++) {
        if (curLine == null) curLine = makeLine();
        let char = text.charAt(i);
        if (char == '\n' || autoWrap) {
          //换行符
          curLine = null;
          autoWrap = false;
        } else {
          makeQuad(char, curLine);
          autoWrap = curLine.width + unitSize >= maxTextWidthReal;
        }
      }
    };

    parseText();
    alignTextLine();
  }

  private getAlignment(alignment: TextAnchor): { v: Vertical; h: Horizontal } {
    let ret: { v: Vertical; h: Horizontal } = { v: Vertical.Upper, h: Horizontal.Left };
    switch (alignment) {
      case TextAnchor.UpperCenter:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.UpperLeft:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.UpperRight:
        ret.v = Vertical.Upper;
        ret.h = Horizontal.Right;
        break;
      case TextAnchor.MiddleCenter:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.MiddleLeft:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.MiddleRight:
        ret.v = Vertical.Middle;
        ret.h = Horizontal.Right;
        break;
      case TextAnchor.LowerCenter:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Center;
        break;
      case TextAnchor.LowerLeft:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Left;
        break;
      case TextAnchor.LowerRight:
        ret.v = Vertical.Lower;
        ret.h = Horizontal.Right;
        break;
    }
    return ret;
  }
}
