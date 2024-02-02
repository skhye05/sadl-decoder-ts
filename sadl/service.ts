import { Buffer } from 'buffer';
import forge from 'node-forge';
import DriverLicenseDecoder from './decoder';
import * as Keys from './encryption-keys';
import { IDriverLicense } from './type';
import * as Versions from './versions';

type BigInteger = forge.jsbn.BigInteger;

export default class DriverLicenseService {
  constructor() {}

  public decode(str: string, encoding?: BufferEncoding) {
    const data = this.decrypt(str, encoding);
    const decoder = new DriverLicenseDecoder(data);
    const licenseData: IDriverLicense = {} as IDriverLicense;

    decoder.readByte();

    licenseData.licenseCodes = decoder.readData(4) as string[];
    licenseData.surname = decoder.readData() as string;
    licenseData.initials = decoder.readData() as string;
    licenseData.identityCountryOfIssue = decoder.readData() as string;
    licenseData.licenseCountryOfIssue = decoder.readData() as string;
    licenseData.vehicleRestrictions = decoder.readData(4) as string[];
    licenseData.licenseNumber = decoder.readData() as string;
    licenseData.identityNumber = '';

    for (let i = 0; i < 13; i++) {
      licenseData.identityNumber += decoder.readCharacter();
    }

    licenseData.identityNumberType = decoder
      .readByte()
      .toLocaleString(undefined, {
        minimumIntegerDigits: 2,
        useGrouping: false,
      });

    const nibbleData = decoder.readIntoNibble();

    licenseData.licenseCodeIssueDates = nibbleData.readNibbleDate(4) as Date[];

    licenseData.driverRestrictionCodes = `${nibbleData.readNibble()}${nibbleData.readNibble()}`;

    licenseData.professionalDrivingPermitExpiryDate =
      nibbleData.readNibbleDate() as Date;

    licenseData.licenseIssueNumber = `${nibbleData.readNibble()}${nibbleData.readNibble()}`;

    licenseData.dateOfBirth = nibbleData.readNibbleDate() as Date;

    licenseData.licenseIssueDate = nibbleData.readNibbleDate() as Date;

    licenseData.licenseExpiryDate = nibbleData.readNibbleDate() as Date;

    licenseData.gender = `${nibbleData.readNibble()}${nibbleData.readNibble()}`;

    licenseData.driverLicenseImage = {
      height: 0,
      width: 0,
    };

    decoder.readByte();
    decoder.readByte();
    decoder.readByte();

    licenseData.driverLicenseImage.width = decoder.readByte();
    decoder.readByte();
    licenseData.driverLicenseImage.height = decoder.readByte();
    return licenseData;
  }

  private decrypt(licenseData: string, encoding?: BufferEncoding): Uint8Array {
    var bytes = new Uint8Array(Buffer.from(licenseData, encoding));

    const versionBytes = bytes.subarray(0, 4);

    let rsaKeyParameters128: forge.pki.rsa.PublicKey;
    let rsaKeyParameters74: forge.pki.rsa.PublicKey;

    if (versionBytes.toString() === Versions.Version1Bytes.toString()) {
      // Interpret licence as version 1
      rsaKeyParameters128 = forge.pki.publicKeyFromPem(
        Keys.Version1LicenseKey128,
      );
      rsaKeyParameters74 = forge.pki.publicKeyFromPem(
        Keys.Version1LicenseKey74,
      );
    } else if (versionBytes.toString() === Versions.Version2Bytes.toString()) {
      // Interpret licence as version 2
      rsaKeyParameters128 = forge.pki.publicKeyFromPem(
        Keys.Version2LicenseKey128,
      );
      rsaKeyParameters74 = forge.pki.publicKeyFromPem(
        Keys.Version2LicenseKey74,
      );
    } else {
      throw new Error('Invalid licence version');
    }

    let decryptedBytes = new Uint8Array(720);
    let dataBytes = bytes.subarray(5);
    var firstBytes = true;

    for (var i = 0; i < 6; i++) {
      const end = firstBytes ? 129 : 128;

      const blockData = dataBytes.subarray(0, end);

      dataBytes = dataBytes.subarray(end);

      let decryptedBlockData = null;

      if (blockData.length >= 128) {
        // Decrypt using 128 byte key
        decryptedBlockData = this.encryptValue(
          blockData,
          rsaKeyParameters128.e,
          rsaKeyParameters128.n,
          blockData.length,
        );
      } else {
        // Decrypt using 74 byte key
        decryptedBlockData = this.encryptValue(
          blockData,
          rsaKeyParameters74.e,
          rsaKeyParameters74.n,
          74,
        );
      }

      decryptedBytes.set(decryptedBlockData, i * end);

      firstBytes = false;
    }

    return decryptedBytes;
  }

  private encryptValue(
    rgb: Uint8Array,
    e: BigInteger,
    n: BigInteger,
    size: number,
  ): Uint8Array {
    // Implement encryption logic or use a library
    forge.util.hexToBytes(rgb.toString());

    const forgeBigIntE = new forge.jsbn.BigInteger(e.toByteArray());
    const forgeBigIntN = new forge.jsbn.BigInteger(n.toByteArray());
    var input = new forge.jsbn.BigInteger(Array.from(rgb));
    var output = input.modPow(forgeBigIntE, forgeBigIntN);

    let result = new Uint8Array(output.toByteArray());

    // Padding the result to match the required size
    if (result.length < size) {
      const padded = new Uint8Array(size);
      padded.set(result, size - result.length);
      result = padded;
    }

    return result;
  }
}
