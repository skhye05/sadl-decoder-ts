import { Nibble } from './nibble';
import { NullableDate } from './type';

class DriverLicenseDecoderNibbleQueue {
  private _nibbleQueue: Nibble[] = [];

  constructor(decoder: DriverLicenseDecoder, until: number = 0x57) {
    this.readIntoNibble(decoder, until);
  }

  public readNibble() {
    return this._nibbleQueue.shift()?.toString() || '';
  }

  public readNibbleDate(asListOf?: number) {
    if (typeof asListOf === 'number') {
      return this.readNibbleDateList(asListOf);
    } else {
      const dateString = this.readNibbleDateString();
      if (!dateString) {
        return null;
      }

      return new Date(dateString);
    }
  }

  private readIntoNibble(decoder: DriverLicenseDecoder, until: number = 0x57) {
    while (true) {
      const currentByte = decoder.readByte();
      if (currentByte === until) {
        break;
      }
      const nibbles = this.byteToNibbles(currentByte);

      this._nibbleQueue.push(nibbles[0]);
      this._nibbleQueue.push(nibbles[1]);
    }
  }

  private byteToNibbles(byte: number): Nibble[] {
    const highNibble = new Nibble(byte >> 4);
    const lowNibble = new Nibble(byte & 0x0f);

    return [highNibble, lowNibble];
  }

  private readNibbleDateString(): string {
    const m = this._nibbleQueue.shift();
    if (!m || m.toString() === 'a') {
      // Assuming '10' is represented as 'a' in hex
      return '';
    }

    const c = this._nibbleQueue.shift()?.toString() || '';
    const d = this._nibbleQueue.shift()?.toString() || '';
    const y = this._nibbleQueue.shift()?.toString() || '';

    const m1 = this._nibbleQueue.shift()?.toString() || '';
    const m2 = this._nibbleQueue.shift()?.toString() || '';

    const d1 = this._nibbleQueue.shift()?.toString() || '';
    const d2 = this._nibbleQueue.shift()?.toString() || '';

    return `${m}${c}${d}${y}-${m1}${m2}-${d1}${d2}`;
  }

  private readNibbleDateList(count: number): NullableDate[] {
    const dateList: NullableDate[] = [];

    for (let i = 0; i < count; i++) {
      const dateString = this.readNibbleDateString();

      if (dateString) {
        dateList.push(new Date(dateString));
      } else {
        dateList.push(null);
      }
    }

    return dateList;
  }
}

export default class DriverLicenseDecoder {
  private _offset: number = 0;
  private _dataView: DataView;
  private readonly _fieldDelimiters: number[] = [0xe0, 0xe1];

  constructor(data: Uint8Array) {
    this._offset = 0;

    if (data.length !== 720) {
      throw new Error('Invalid licence data');
    }

    this._dataView = new DataView(data.buffer);

    // Skip bytes until byte with value 0x82 is read
    while (this._dataView.getUint8(this._offset) !== 0x82) {
      this._offset++;
    }

    // Skip byte 0x5a
    this._offset++;
  }

  public readData(asListOf?: number) {
    if (typeof asListOf === 'number') {
      return this.readStringList(asListOf);
    } else {
      return this.readString();
    }
  }

  public readCharacter() {
    const currentByte = this._dataView.getUint8(this._offset++);
    return String.fromCharCode(currentByte);
  }

  public readByte() {
    return this._dataView.getUint8(this._offset++);
  }

  public readIntoNibble(until: number = 0x57) {
    return new DriverLicenseDecoderNibbleQueue(this, until);
  }

  private readString(): string {
    let value = '';
    let currentByte: number;

    while (true) {
      currentByte = this._dataView.getUint8(this._offset++);
      if (this._fieldDelimiters.includes(currentByte)) {
        break;
      }

      value += String.fromCharCode(currentByte);
    }

    return value;
  }

  private readStringList(length: number): string[] {
    let valueList: string[] = [];
    let skippedCharacter = false;

    for (let i = 0; i < length; i++) {
      let value = '';
      let currentByte: number;

      while (true) {
        currentByte = this._dataView.getUint8(this._offset++);
        if (currentByte === 0xe0) {
          break;
        } else if (currentByte === 0xe1) {
          if (!skippedCharacter) {
            i++;
            skippedCharacter = true;
          }
          break;
        }

        value += String.fromCharCode(currentByte);
      }

      if (value !== '') {
        valueList.push(value);
      }
    }

    return valueList;
  }
}
