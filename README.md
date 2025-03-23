# Prisma TypeScript Interfaces Generator

[`prisma-generator-typescript-interfaces`](https://www.npmjs.com/package/prisma-generator-typescript-interfaces) - A [Prisma generator](https://www.prisma.io/docs/concepts/components/prisma-schema/generators) that creates zero-dependency TypeScript interfaces from Prisma schema.

## Motivation

While Prisma client's generated types are sufficient for most use cases, there are some scenarios where using them is not convenient or possible, due to the fact that they rely on both the `@prisma/client` package and on the client generated from your Prisma schema. That is where this generator comes in. It generates a zero-dependency TypeScript file containing type definitions for all your models. This file will not contain any imports and can be used standalone in any TypeScript app. By default, the definitions are [type-compatible](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) with the Prisma client types, however this can be customized via the [options](#options), see below for more info.

## Usage

To use this generator, first install the package:

```
npm install --save-dev prisma-generator-typescript-interfaces
```

Next add the generator to your Prisma schema:

```prisma
generator typescriptInterfaces {
  provider = "prisma-generator-typescript-interfaces"
}
```

And finally generate your Prisma schema:

```
npx prisma generate
```

By default, that will output the TypeScript interface definitions to a file called `interfaces.ts` in your `prisma` folder, but this can be changed by specifying the `output` option. As mentioned above, the generated types will, by default, be [type-compatible](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) with the Prisma client types. If you instead want to generate types matching the `JSON.stringify`-ed versions of your models, you will need to change some of the options, like so:

```prisma
generator typescriptInterfaces {
  provider    = "prisma-generator-typescript-interfaces"
  dateType    = "string"
  bigIntType  = "string"
  decimalType = "string"
  bytesType   = "ArrayObject"
}
```

Note that `bigint` types don't have a default `toJSON` method, so the above assumes that you are converting them to strings somewhere along the line.

### External Types

To use external types, add the `externalTypesPath` option pointing to a file containing TypeScript type definitions and annotate fields in your Prisma schema with triple slash comments of the form `/// [Type]`, where `Type` is a type or interface exported from the specified path. For example:

```prisma
generator typescriptInterfaces {
  provider = "prisma-generator-typescript-interfaces"
  externalTypesPath = "../path/to/external-types.js"
}
```

The path to the external types file will be resolved relative to the output path.

> [!Note]
> The filename (**including extension**) specified in `externalTypesPath` will be copied to the generated file exactly. For example, if you specify `externalTypesPath = "../path/to/external-types.js"`, the generated file will contain `import { Type } from "<relative_path_to_external_types_parent_dir>/external-types.js"`. If you specify `externalTypesPath = "../path/to/external-types"`, the generated file will contain `import { Type } from "<relative_path_to_external_types_parent_dir>/external-types"`. This is to allow for easier integration with other tools that may expect a specific file extension.

## Example

Here is an example of a configuration that generates two separate outputs, `interfaces.ts` with types compatible with the Prisma client types, and a second `json-interfaces.ts` file with types matching the output of `JSON.stringify` when run on the models. Both files are output to the `src/dto` folder (which will be created if it doesn't exist) and are formatted using Prettier. The models in `json-interfaces.ts` also get a `Json` suffix attached to them.

#### Input

<details>
<summary>prisma/schema.prisma</summary>

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

generator typescriptInterfaces {
  provider = "prisma-generator-typescript-interfaces"
  output   = "../src/dto/interfaces.ts"
  prettier = true
}

generator typescriptInterfacesJson {
  provider    = "prisma-generator-typescript-interfaces"
  output      = "../src/dto/json-interfaces.ts"
  modelSuffix = "Json"
  dateType    = "string"
  bigIntType  = "string"
  decimalType = "string"
  bytesType   = "ArrayObject"
  exportEnums = false
  prettier    = true
}

enum Gender {
  Male
  Female
  Other
}

model Person {
  id        Int      @id @default(autoincrement())
  name      String
  age       Int
  email     String?
  gender    Gender
  addressId Int
  address   Address  @relation(fields: [addressId], references: [id])
  friendsOf Person[] @relation("Friends")
  friends   Person[] @relation("Friends")
  data      Data?
}

model Address {
  id           Int      @id
  streetNumber Int
  streetName   String
  city         String
  isBilling    Boolean
  people       Person[]
}

model Data {
  id           String   @id @default(uuid()) @db.Uuid
  stringField  String
  booleanField Boolean
  intField     Int
  bigIntField  BigInt
  floatField   Float
  decimalField Decimal
  dateField    DateTime
  jsonField    Json
  bytesField   Bytes

  optionalStringField  String?
  optionalBooleanField Boolean?
  optionalIntField     Int?
  optionalBigIntField  BigInt?
  optionalFloatField   Float?
  optionalDecimalField Decimal?
  optionalDateField    DateTime?
  optionalJsonField    Json?
  optionalBytesField   Bytes?

  stringArrayField  String[]
  booleanArrayField Boolean[]
  intArrayField     Int[]
  bigIntArrayField  BigInt[]
  floatArrayField   Float[]
  decimalArrayField Decimal[]
  dateArrayField    DateTime[]
  jsonArrayField    Json[]
  bytesArrayField   Bytes[]

  personId Int    @unique
  person   Person @relation(fields: [personId], references: [id])
}

```

</details>

#### Output

<details>
<summary>src/dto/interfaces.ts</summary>

```typescript
// This file was auto-generated by prisma-generator-typescript-interfaces

export type Gender = "Male" | "Female" | "Other";

export interface Person {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: Gender;
  addressId: number;
  address?: Address;
  friendsOf?: Person[];
  friends?: Person[];
  data?: Data | null;
}

export interface Address {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people?: Person[];
}

export interface Data {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: bigint;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Uint8Array;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: bigint | null;
  optionalFloatField: number | null;
  optionalDecimalField: Decimal | null;
  optionalDateField: Date | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: Uint8Array | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: bigint[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Uint8Array[];
  personId: number;
  person?: Person;
}

type Decimal = { valueOf(): string };

type JsonValue =
  | string
  | number
  | boolean
  | { [key in string]?: JsonValue }
  | Array<JsonValue>
  | null;
```

</details>

<details>
<summary>src/dto/json-interfaces.ts</summary>

```typescript
// This file was auto-generated by prisma-generator-typescript-interfaces

type Gender = "Male" | "Female" | "Other";

export interface PersonJson {
  id: number;
  name: string;
  age: number;
  email: string | null;
  gender: Gender;
  addressId: number;
  address?: AddressJson;
  friendsOf?: PersonJson[];
  friends?: PersonJson[];
  data?: DataJson | null;
}

export interface AddressJson {
  id: number;
  streetNumber: number;
  streetName: string;
  city: string;
  isBilling: boolean;
  people?: PersonJson[];
}

export interface DataJson {
  id: string;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: string;
  floatField: number;
  decimalField: string;
  dateField: string;
  jsonField: JsonValue;
  bytesField: ArrayObject;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: string | null;
  optionalFloatField: number | null;
  optionalDecimalField: string | null;
  optionalDateField: string | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: ArrayObject | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: string[];
  floatArrayField: number[];
  decimalArrayField: string[];
  dateArrayField: string[];
  jsonArrayField: JsonValue[];
  bytesArrayField: ArrayObject[];
  personId: number;
  person?: PersonJson;
}

type JsonValue =
  | string
  | number
  | boolean
  | { [key in string]?: JsonValue }
  | Array<JsonValue>
  | null;

type ArrayObject = { [index: number]: number } & { length?: never };
```

</details>

## Options

| **Option**            |                                        **Type**                                         |                                **Default**                                 | **Description**                                                                                                                                                                                               |
| --------------------- | :-------------------------------------------------------------------------------------: | :------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| output                |                                        `string`                                         |                             `"interfaces.ts"`                              | The output location for the generated TypeScript interfaces.                                                                                                                                                  |
| enumPrefix            |                                        `string`                                         |                                    `""`                                    | Prefix to add to enum types.                                                                                                                                                                                  |
| enumSuffix            |                                        `string`                                         |                                    `""`                                    | Suffix to add to enum types.                                                                                                                                                                                  |
| enumObjectPrefix      |                                        `string`                                         |                                    `""`                                    | Prefix to add to enum objects. Only applies when `enumType` is `object`.                                                                                                                                      |
| enumObjectSuffix      |                                        `string`                                         |                                    `""`                                    | Suffix to add to enum objects. Only applies when `enumType` is `object`.                                                                                                                                      |
| modelPrefix           |                                        `string`                                         |                                    `""`                                    | Prefix to add to model types.                                                                                                                                                                                 |
| modelSuffix           |                                        `string`                                         |                                    `""`                                    | Suffix to add to model types.                                                                                                                                                                                 |
| typePrefix            |                                        `string`                                         |                                    `""`                                    | Prefix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (MongoDB only).                                                               |
| typeSuffix            |                                        `string`                                         |                                    `""`                                    | Suffix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (MongoDB only).                                                               |
| headerComment         |                                        `string`                                         | `"This file was auto-generated by prisma-generator-typescript-interfaces"` | Sets the header comment added to the top of the generated file. Set this to an empty string to disable the header comment. Supports multiple lines with `"\n"`.                                               |
| modelType             |                                 `"interface" \| "type"`                                 |                               `"interface"`                                | Controls how model definitions are generated. `"interface"` will create TypeScript interfaces, `"type"` will create TypeScript types. If using MongoDB, this also affects `type` definitions.                 |
| enumType              |                          `"stringUnion" \| "enum" \| "object"`                          |                              `"stringUnion"`                               | Controls how enums are generated. `"object"` will create an object and string union type like the Prisma client, `"enum"` will create TypeScript enums, `"stringUnion"` will just create a string union type. |
| dateType              |                            `"Date" \| "string" \| "number"`                             |                                  `"Date"`                                  | The type to use for DateTime model fields.                                                                                                                                                                    |
| bigIntType            |                           `"bigint" \| "string" \| "number"`                            |                                 `"bigint"`                                 | The type to use for BigInt model fields.                                                                                                                                                                      |
| decimalType           |                           `"Decimal" \| "string" \| "number"`                           |                                `"Decimal"`                                 | The type to use for Decimal model fields. The `Decimal` type here is just an interface with a `valueOf()` function. You will need to cast to an actual Decimal type if you want to use other methods.         |
| bytesType             | `"Uint8Array" \| "Buffer" \| "ArrayObject" \| "BufferObject" \| "string" \| "number[]"` |                               `"Uint8Array"`                               | The type to use for Bytes model fields. `ArrayObject` is a type which matches a `JSON.stringify`-ed Uint8Array. `BufferObject` is a type which matches a `JSON.stringify`-ed Buffer.                          |
| exportEnums           |                                        `boolean`                                        |                                   `true`                                   | Controls whether enum definitions are exported. If `false`, enums will only be defined in the module scope for use by dependent types. Respects `enumType`.                                                   |
| optionalRelations     |                                        `boolean`                                        |                                   `true`                                   | Controls whether model relation fields are optional. If `true`, all model relation fields will use `?:` in the field definition.                                                                              |
| omitRelations         |                                        `boolean`                                        |                                  `false`                                   | Controls whether model relation fields are omitted. If `true`, model definitions will not include their relations.                                                                                            |
| optionalNullables     |                                        `boolean`                                        |                                  `false`                                   | Controls whether nullable fields are optional. Nullable fields are always defined with `\| null` in their type definition, but if this is `true`, they will also use `?:`.                                    |
| prettier              |                                        `boolean`                                        |                                  `false`                                   | Formats the output using Prettier. Setting this to `true` requires that the `prettier` package is available.                                                                                                  |
| resolvePrettierConfig |                                        `boolean`                                        |                                   `true`                                   | Tries to find and use a Prettier config file relative to the output location.                                                                                                                                 |
| externalTypesPath     |                                        `string`                                         |                                    `""`                                    | The path to a file containing TypeScript type definitions to be imported and used in the generated file.                                                                                                      |

## Issues

Please report any issues to the [issues](https://github.com/mogzol/prisma-generator-typescript-interfaces/issues) page. I am actively using this package, so I'll try my best to address any issues that are reported. Alternatively, feel free to submit a PR.

## Developing

All the code for this generator is contained within the `generator.ts` file. You can build the generator by running `npm install` then `npm run build`.

### Tests

You can run tests with `npm run test`. Tests are run using a custom script, see `test.ts` for details. You can add new tests by placing a Prisma schema and the expected output in a folder under the `tests` directory, you may want to look at the `tests/options-behavior` test as an example.

You can run specific tests by passing them as arguments to the test command:

```
npm run test -- options-behavior validation-errors
```

When a test fails, you can see the generated output in the `__TEST_TMP__` folder inside that test's directory. Compare this with the expected output to see why it failed.

Please ensure all tests are passing and that the code is properly linted (`npm run lint`) before submitting a PR, thanks!
