import { arrayToString } from './arrayToString.js';

export class FeatureTable {
    private buffer: any;
    private binOffset: any;
    private binLength: any;
    private header: any;

    constructor( buffer, start, headerLength, binLength ) {

        this.buffer = buffer;
        this.binOffset = start + headerLength;
        this.binLength = binLength;

        let header = null;
        if ( headerLength !== 0 ) {

            const headerData = new Uint8Array( buffer, start, headerLength );
            header = JSON.parse( arrayToString( headerData ) );

        } else {

            header = {};

        }
        this.header = header;

    }

    getKeys() {

        return Object.keys( this.header );

    }

    getData( key, count?, defaultComponentType = null, defaultType = null ) {

        const header = this.header;

        if ( ! ( key in header ) ) {

            return null;

        }

        const feature = header[ key ];
        if ( ! ( feature instanceof Object ) ) {

            return feature;

        } else if ( Array.isArray( feature ) ) {

            return feature;

        } else {

            const { buffer, binOffset, binLength } = this;
            const byteOffset = feature.byteOffset || 0;
            const featureType = feature.type || defaultType;
            const featureComponentType = feature.componentType || defaultComponentType;

            if ( 'type' in feature && defaultType && feature.type !== defaultType ) {

                throw new Error( 'FeatureTable: Specified type does not match expected type.' );

            }

            let stride;
            switch ( featureType ) {

                case 'SCALAR':
                    stride = 1;
                    break;

                case 'VEC2':
                    stride = 2;
                    break;

                case 'VEC3':
                    stride = 3;
                    break;

                case 'VEC4':
                    stride = 4;
                    break;

                default:
                    throw new Error( `FeatureTable : Feature type not provided for "${ key }".` );

            }

            let data;
            const arrayStart = binOffset + byteOffset;
            const arrayLength = count * stride;

            switch ( featureComponentType ) {

                case 'BYTE':
                    data = new Int8Array( buffer, arrayStart, arrayLength );
                    break;

                case 'UNSIGNED_BYTE':
                    data = new Uint8Array( buffer, arrayStart, arrayLength );
                    break;

                case 'SHORT':
                    data = new Int16Array( buffer, arrayStart, arrayLength );
                    break;

                case 'UNSIGNED_SHORT':
                    data = new Uint16Array( buffer, arrayStart, arrayLength );
                    break;

                case 'INT':
                    data = new Int32Array( buffer, arrayStart, arrayLength );
                    break;

                case 'UNSIGNED_INT':
                    data = new Uint32Array( buffer, arrayStart, arrayLength );
                    break;

                case 'FLOAT':
                    data = new Float32Array( buffer, arrayStart, arrayLength );
                    break;

                case 'DOUBLE':
                    data = new Float64Array( buffer, arrayStart, arrayLength );
                    break;

                default:
                    throw new Error( `FeatureTable : Feature component type not provided for "${ key }".` );

            }

            const dataEnd = arrayStart + arrayLength * data.BYTES_PER_ELEMENT;
            if ( dataEnd > binOffset + binLength ) {

                throw new Error( 'FeatureTable: Feature data read outside binary body length.' );

            }

            return data;

        }

    }

}

export class BatchTable extends FeatureTable {
    private batchSize: any;

    constructor( buffer, batchSize, start, headerLength, binLength ) {

        super( buffer, start, headerLength, binLength );
        this.batchSize = batchSize;

    }

    getData( key, componentType = null, type = null ) {

        return super.getData( key, this.batchSize, componentType, type );

    }

}
