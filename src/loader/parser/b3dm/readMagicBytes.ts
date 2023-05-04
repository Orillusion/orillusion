export function readMagicBytes( bufferOrDataView ) {

	let view;
	if ( bufferOrDataView instanceof DataView ) {

		view = bufferOrDataView;

	} else {

		view = new DataView( bufferOrDataView );

	}

	if ( String.fromCharCode( view.getUint8( 0 ) ) === '{' ) {

		return null;

	}

	let magicBytes = '';
	for ( let i = 0; i < 4; i ++ ) {

		magicBytes += String.fromCharCode( view.getUint8( i ) );

	}

	return magicBytes;

}
