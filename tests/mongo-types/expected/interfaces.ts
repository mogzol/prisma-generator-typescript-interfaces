export enum Gender {
  Male = "Male",
  Female = "Female",
  Other = "Other"
}

export enum PhotoType {
  Selfie = "Selfie",
  Profile = "Profile",
  Tagged = "Tagged"
}

export interface Person {
  id: number;
  name: string;
  gender: Gender;
  addressId: number;
  address: Address;
  photos: Photo[];
  tags: Tag | null;
}

export interface Address {
  id: number;
  addresText: string;
  people: Person[];
}

export interface Photo {
  height: number;
  Width: number;
  url: string;
  type: PhotoType;
}

export interface Tag {
  id: number;
  name: string;
}
