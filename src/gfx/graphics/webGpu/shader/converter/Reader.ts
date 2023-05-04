/**
 * @internal
 * @group GFX
 */
export class Reader {
    protected _char: string;
    protected _line: number;
    protected _column: number;
    protected _source: string;
    protected _currPosition: number;
    protected _nextPosition: number;

    constructor(source: string) {
        this.reset(source);
    }

    public reset(source: string) {
        this._char = '';
        this._line = 0;
        this._column = 0;
        this._source = source;
        this._currPosition = 0;
        this._nextPosition = 0;
    }

    public get source(): string {
        return this._source;
    }

    public getChar(): string {
        return this._char;
    }

    public get currPosition(): number {
        return this._currPosition;
    }

    public peekChar(): string {
        return this._nextPosition >= this._source.length ? '\0' : this._source[this._nextPosition];
    }

    public readChar() {
        this._char = this._nextPosition >= this._source.length ? '\0' : this._source[this._nextPosition];
        if (this._char !== '\n') {
            this._column++;
        } else {
            this._line++;
            this._column = 0;
        }
        this._currPosition = this._nextPosition;
        this._nextPosition++;
    }

    public readCharAndSkipWhitespace() {
        this.readChar();
        this.skipWhitespace();
    }

    public readIdentifier(): string {
        var pos = this._currPosition;
        while (this.isIdentifier(this._char)) {
            this.readChar();
        }
        return this._source.substring(pos, this._currPosition);
    }

    public isIdentifier(char: string): boolean {
        var code = char.charCodeAt(0);
        // ('a' <= code && code <= 'z') || ('A' <= code && code <= 'Z') || ('0' <= code && code <= '9') || code == '_';
        return (0x61 <= code && code <= 0x7a) || (0x41 <= code && code <= 0x5a) || (0x30 <= code && code <= 0x39) || code == 0x5f;
    }

    public skipWhitespace() {
        while (this.IsWhitespace(this._char)) {
            this.readChar();
        }
    }

    public IsWhitespace(char: string): boolean {
        return char === ' ' || char === '\t' || char === '\r' || char === '\n';
    }

    public skipComment() {
        while (this._char !== '\n' && this._char !== '\0') {
            this.readChar();
        }
        this.skipWhitespace();
    }

    public skipMultilineComment() {
        if (this._char !== '/' && this.peekChar() !== '*') {
            return;
        }
        this.readChar();
        this.readChar();

        for (let nCount: number = 1; nCount > 0 && this._char !== '\0';) {
            this.readChar();
            if (this._char === '/' && this.peekChar() === '*') {
                nCount++;
                this.readChar();
                continue;
            } else if (this._char === '*' && this.peekChar() === '/') {
                nCount--;
                this.readChar();
                continue;
            }
        }

        this.readChar();
        this.readChar();
        this.skipWhitespace();
    }

    public isDigit(char: string): boolean {
        var code = char.charCodeAt(0);
        // ('0' <= code && code <= '9') ;
        return 0x30 <= code && code <= 0x39;
    }

    public readNumber(): string {
        var pos = this._currPosition;
        while (this.isDigit(this._char)) {
            this.readChar();
        }
        if (this._char === '.') {
            this.readChar();
            while (this.isDigit(this._char)) {
                this.readChar();
            }
        }
        return this._source.substring(pos, this._currPosition);
    }

    public readValue(): string {
        if (this.isDigit(this._char)) {
            return this.readNumber();
        }
        return this.readIdentifier();
    }

    public readLine(): string {
        var pos = this._currPosition;
        var index = this._source.indexOf('\n', this._currPosition);
        if (index == -1) {
            index = this._source.length;
        }
        this._line++;
        this._column = 0;
        this._currPosition = index;
        this._nextPosition = index + 1;
        return this._source.substring(pos, index + 1);
    }
}
