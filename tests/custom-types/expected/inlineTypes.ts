// This file was auto-generated by prisma-generator-typescript-interfaces

export type Gender = "Male" | "Female" | "Other";

export type DataTest = "Apple" | "Banana" | "Orange" | "Pear";

export interface Person {
  id: CustomInt;
  name: CustomString;
  age: CustomInt;
  email: CustomString | null;
  gender: Gender;
  addressId: CustomInt;
  address?: Address;
  friends?: Person[];
  friendsOf?: Person[];
  data?: Data | null;
}

export interface Address {
  id: CustomInt;
  streetNumber: CustomInt;
  streetName: CustomString;
  city: CustomString;
  isBilling: CustomBoolean;
  people?: Person[];
}

export interface Data {
  id: CustomString;
  stringField: CustomString;
  booleanField: CustomBoolean;
  intField: CustomInt;
  floatField: CustomFloat;
  jsonField: CustomJson;
  dateField: CustomDate;
  bigIntField: CustomBigInt;
  decimalField: CustomDecimal;
  bytesField: CustomBytes;
  enumField: DataTest;
  optionalStringField: CustomString | null;
  optionalBooleanField: CustomBoolean | null;
  optionalIntField: CustomInt | null;
  optionalFloatField: CustomFloat | null;
  optionalJsonField: CustomJson | null;
  optionalDateField: CustomDate | null;
  optionalBigIntField: CustomBigInt | null;
  optionalDecimalField: CustomDecimal | null;
  optionalBytesField: CustomBytes | null;
  optionalEnumField: DataTest | null;
  stringArrayField: CustomString[];
  booleanArrayField: CustomBoolean[];
  intArrayField: CustomInt[];
  floatArrayField: CustomFloat[];
  jsonArrayField: CustomJson[];
  dateArrayField: CustomDate[];
  bigIntArrayField: CustomBigInt[];
  decimalArrayField: CustomDecimal[];
  bytesArrayField: CustomBytes[];
  enumArrayField: DataTest[];
  personId: CustomInt;
  person?: Person;
}
