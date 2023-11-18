export type enumGenderEnum = "Male" | "Female" | "Other";

export type enumPhotoTypeEnum = "Selfie" | "Profile" | "Tagged";

export interface modelPersonModel {
  id: number;
  name: string;
  gender: enumGenderEnum;
  addressId: number;
  address?: modelAddressModel;
  photos: typePhotoType[];
  tags: typeTagType | null;
}

export interface modelAddressModel {
  id: number;
  addresText: string;
  people?: modelPersonModel[];
}

export interface typePhotoType {
  height: number;
  Width: number;
  url: string;
  type: enumPhotoTypeEnum;
}

export interface typeTagType {
  id: number;
  name: string;
}
