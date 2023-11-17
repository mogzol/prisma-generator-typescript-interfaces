export enum enumGenderEnum {
  Male = "Male",
  Female = "Female",
  Other = "Other"
}

export interface modelPersonModel {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: enumGenderEnum;
  addressId: number;
  address: modelAddressModel;
  friends: modelPersonModel[];
  friendsOf: modelPersonModel[];
  data: modelDataModel | null;
}

export interface modelAddressModel {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people: modelPersonModel[];
}

export interface modelDataModel {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: bigint;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Buffer;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: bigint | null;
  optionalFloatField: number | null;
  optionalDecimalField: Decimal | null;
  optionalDateField: Date | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: Buffer | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: bigint[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Buffer[];
  personId: number;
  person: modelPersonModel;
}

interface Decimal {
  valueOf(): string;
}

type JsonValue = string | number | boolean | { [key in string]: JsonValue } | Array<JsonValue> | null;
