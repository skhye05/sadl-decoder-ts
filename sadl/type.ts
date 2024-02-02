export interface DriverLicenseImage {
  // Width of the image
  width: number;

  // Height of the image
  height: number;
}

export interface IDriverLicense {
  // Surname
  surname: string;

  // Initials
  initials: string;

  // Identity number
  identityNumber: string;

  // Date of birth
  dateOfBirth?: NullableDate;

  // Gender (01 = male, 02 = female)
  gender: string;

  // License codes
  licenseCodes: string[];

  // License number
  licenseNumber: string;

  // Identity country of issue
  identityCountryOfIssue: string;

  // License country of issue
  licenseCountryOfIssue: string;

  // Vehicle restrictions (up to 4 restrictions)
  vehicleRestrictions: string[];

  // Identity number type (02 = South African)
  identityNumberType: string;

  // License code issue dates (up to 4 dates)
  licenseCodeIssueDates: NullableDate[];

  // Driver restriction codes, formatted as XX (0 = none, 1 = glasses, 2 = artificial limb)
  driverRestrictionCodes: string;

  // Professional driving permit expiry date
  professionalDrivingPermitExpiryDate?: NullableDate;

  // License issue number
  licenseIssueNumber: string;

  // Driver license image
  driverLicenseImage: DriverLicenseImage;

  // License issue date
  licenseIssueDate?: NullableDate;

  // License expiry date
  licenseExpiryDate?: NullableDate;
}

export type NullableDate = Date | null;
