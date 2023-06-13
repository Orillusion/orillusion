//------------------------------------------------------------------------------  
// <copyright company="Microsoft">  
//     Copyright (c) 2006-2009 Microsoft Corporation.  All rights reserved.  
// </copyright>  
//------------------------------------------------------------------------------  

import { Vector2 } from "@orillusion/core";

  

     class TileSystem  {
       static EarthRadius: number;  
       static MinLatitude: number;
       static MaxLatitude: number;
       static MinLongitude: number;
       static MaxLongitude: number;

        constructor(){
            TileSystem.EarthRadius = 6378137;  
            TileSystem.MinLatitude = -85.05112878;  
            TileSystem.MaxLatitude = 85.05112878;  
            TileSystem.MinLongitude = -180;  
            TileSystem.MaxLongitude = 180;  
        }
        
  
        static Clip( n:number,  minValue:number,  maxValue:number)  {  
            return Math.min(Math.max(n, minValue), maxValue);  
        }  
  

         static  MapSize(levelOfDetail:number )  
        {  
            return  256 << levelOfDetail;  
        }  
  

        public static  GroundResolution( latitude:number,  levelOfDetail:number)  
        {  
            return latitude = this.Clip(latitude, this.MinLatitude, this.MaxLatitude), 
             Math.cos(latitude * Math.PI / 180) * 2 * Math.PI * this.EarthRadius / this.MapSize(levelOfDetail);  
        }  
  
 
        public static  MapScale( latitude:number,  levelOfDetail:number,  screenDpi:number)  
        {  
            return this.GroundResolution(latitude, levelOfDetail) * screenDpi / 0.0254;  
        }  
  
 
        public static LatLongToPixelXY( latitude:number,  longitude:number,  levelOfDetail:number)  
        {  
            latitude = this.Clip(latitude, this.MinLatitude, this.MaxLatitude);  
            longitude = this.Clip(longitude, this.MinLongitude, this.MaxLongitude);  
  
            let x = (longitude + 180) / 360;   
            let sinLatitude = Math.sin(latitude * Math.PI / 180);  
            let y = 0.5 - Math.log((1 + sinLatitude) / (1 - sinLatitude)) / (4 * Math.PI);  
  
            let mapSize = this.MapSize(levelOfDetail);  
           let pixelX = this.Clip(x * mapSize + 0.5, 0, mapSize - 1);  
           let pixelY = this.Clip(y * mapSize + 0.5, 0, mapSize - 1);  
           return new Vector2(pixelX,pixelY);
        }  
  
     
        public static  PixelXYToLatLong( pixelX:number,  pixelY:number,  levelOfDetail:number)  
        {  
            let mapSize = this.MapSize(levelOfDetail);  
            let x = (this.Clip(pixelX, 0, mapSize - 1) / mapSize) - 0.5;  
            let y = 0.5 - (this.Clip(pixelY, 0, mapSize - 1) / mapSize);  
  
           let latitude = 90 - 360 * Math.atan(Math.exp(-y * 2 * Math.PI)) / Math.PI;  
           let  longitude = 360 * x;  
            return new Vector2(latitude,longitude)
        }  
  

         static PixelXYToTileXY(pixelX:number,  pixelY:number){  
            let tileX = parseInt((pixelX / 256).toString());  
            let tileY = parseInt((pixelY / 256).toString());  
            return new Vector2(tileX,tileY)
        }  

     static TileXYToPixelXY(tileX:number ,  tileY:number)  {  
           let pixelX = tileX * 256;  
           let pixelY = tileY * 256;  
           return new Vector2(pixelX,pixelY)
        }  
  
 
       static TileXYToQuadKey(tileX:number,  tileY:number,  levelOfDetail:number)  
        {  
            let quadKey = '';  
            for (let i = levelOfDetail; i > 0; i--)  
            {  
                let digit = 0;  
                let mask = 1 << (i - 1);  
                if ((tileX & mask) != 0)  
                {  
                    digit++;  
                }  
                if ((tileY & mask) != 0)  
                {  
                    digit++;  
                    digit++;  
                }  
                quadKey+=digit;  
            }  
            return quadKey;  
        }  
  

        static  QuadKeyToTileXY(quadKey:string , tileX :number, tileY:number , levelOfDetail:number )  
        {  
            tileX = tileY = 0;  
            levelOfDetail = quadKey.length;  
            for (let i = levelOfDetail; i > 0; i--)  {  
                let mask = 1 << (i - 1);  
                switch (quadKey[levelOfDetail - i])  
                {  
                    case '0':  
                        break;  
  
                    case '1':  
                        tileX |= mask;  
                        break;  
  
                    case '2':  
                        tileY |= mask;  
                        break;  
  
                    case '3':  
                        tileX |= mask;  
                        tileY |= mask;  
                        break;  
  
                    default:  
                        throw  console.warn("111111");
                }  
            }  
        }  
    }  
export default TileSystem