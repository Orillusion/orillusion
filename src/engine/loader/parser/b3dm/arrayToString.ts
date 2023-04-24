export function arrayToString( array ) {

    const utf8decoder = new TextDecoder();
    return utf8decoder.decode( array );

}
