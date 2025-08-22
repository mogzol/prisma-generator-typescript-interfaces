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
  bytesType   = "number[]"
}
```

Note that `bigint` types don't have a default `toJSON` method, so the above assumes that you are converting them to strings somewhere along the line. It also assumes that the `Uint8Array` values from `Bytes` fields are being converted to `number[]` arrays.

## Example

Here is an example of a configuration that generates two separate outputs, `interfaces.ts` with types compatible with the Prisma client types, and a second `json-interfaces.ts` file with types matching the output of `JSON.stringify` when run on the models (with the exception of `Bytes` and `BigInt` types, which will be `number[]` and `string` respectively). Both files are output to the `src/dto` folder (which will be created if it doesn't exist) and are formatted using Prettier. The models in `json-interfaces.ts` also get a `Json` suffix attached to them.

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
  bytesType   = "number[]"
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
  bytesField: number[];
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: string | null;
  optionalFloatField: number | null;
  optionalDecimalField: string | null;
  optionalDateField: string | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: number[] | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: string[];
  floatArrayField: number[];
  decimalArrayField: string[];
  dateArrayField: string[];
  jsonArrayField: JsonValue[];
  bytesArrayField: number[][];
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
```

</details>

## Options

| Option(s)                                                                                                                                          |                 Type                  |                                  Default                                   | Description                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------------- | :-----------------------------------: | :------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| output                                                                                                                                             |               `string`                |                             `"interfaces.ts"`                              | The output location for the generated TypeScript interfaces.                                                                                                                                                  |
| <br/>enumPrefix,<br/>enumSuffix <br/><br/>                                                                                                         |               `string`                |                                    `""`                                    | Prefix/suffix to add to enum types.                                                                                                                                                                           |
| <br/>enumObjectPrefix,<br/>enumObjectSuffix <br/><br/>                                                                                             |               `string`                |                                    `""`                                    | Prefix/suffix to add to enum objects. Only applies when `enumType` is `object`.                                                                                                                               |
| <br/>modelPrefix,<br/>modelSuffix <br/><br/>                                                                                                       |               `string`                |                                    `""`                                    | Prefix/suffix to add to model types.                                                                                                                                                                          |
| <br/>typePrefix,<br/>typeSuffix <br/><br/>                                                                                                         |               `string`                |                                    `""`                                    | Prefix/suffix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (MongoDB only).                                                        |
| headerComment                                                                                                                                      |               `string`                | `"This file was auto-generated by prisma-generator-typescript-interfaces"` | Sets the header comment added to the top of the generated file. Set this to an empty string to disable the header comment. Supports multiple lines with `"\n"`.                                               |
| modelType                                                                                                                                          |        `"interface" \| "type"`        |                               `"interface"`                                | Controls how model definitions are generated. `"interface"` will create TypeScript interfaces, `"type"` will create TypeScript types. If using MongoDB, this also affects `type` definitions.                 |
| enumType                                                                                                                                           | `"stringUnion" \| "enum" \| "object"` |                              `"stringUnion"`                               | Controls how enums are generated. `"object"` will create an object and string union type like the Prisma client, `"enum"` will create TypeScript enums, `"stringUnion"` will just create a string union type. |
| relations                                                                                                                                          | `"required" \| "optional" \| "none"`  |                                `"optional"`                                | Controls how relation fields are specified. `"required"` will have them be required fields on the model, `"optional"` will have them be optional, and `"none"` will exclude relations entirely.               |
| counts                                                                                                                                             | `"required" \| "optional" \| "none"`  |                                  `"none"`                                  | Controls the `_count` field for models with relations. `"required"` will make it and all counts in it be required, `"optional"` will have them be optional, and `"none"` will exclude counts entirely.        |
| <br/>stringType,<br/>booleanType,<br/>intType,<br/>floatType,<br/>jsonType,<br/>dateType,<br/>bigIntType,<br/>decimalType,<br/>bytesType<br/><br/> |               `string`                |                    See [Custom Types](CUSTOM_TYPES.md)                     | The TypeScript type to use for each Prisma type. See [Custom Types](CUSTOM_TYPES.md) for details.                                                                                                             |
| typeImportPath                                                                                                                                     |               `string`                |                                    `""`                                    | The path to import custom types from when using [imported types](CUSTOM_TYPES.md#imported-types) or [per-field-types](CUSTOM_TYPES.md#per-field-types).                                                       |
| perFieldTypes                                                                                                                                      |               `boolean`               |                                   `true`                                   | Whether to enable [per-field-types](CUSTOM_TYPES.md#per-field-types).                                                                                                                                         |
| exportEnums                                                                                                                                        |               `boolean`               |                                   `true`                                   | Controls whether enum definitions are exported. If `false`, enums will only be defined inside the generated file.                                                                                             |
| includeComments                                                                                                                                    |               `boolean`               |                                   `true`                                   | Controls whether documentation from the schema (comments starting with `///`) are copied into the generated output as `/** ... */` documentation blocks.                                                      |
| optionalNullables                                                                                                                                  |               `boolean`               |                                  `false`                                   | Controls whether nullable fields are optional. Nullable fields are always defined with `\| null` in their type definition, but if this is `true`, they will also use `?:`.                                    |
| prettier                                                                                                                                           |               `boolean`               |                                  `false`                                   | Formats the output using Prettier. Setting this to `true` requires that the `prettier` package is available.                                                                                                  |
| prettierConfigPath                                                                                                                                 |           `string \| null`            |                                    `""`                                    | Path to the Prettier config file. If this is an empty string, the Prettier config file will be resolved relative to the output location. If this is `null`, no Prettier config file will be used.             |

## Issues

Please report any issues to the [issues](https://github.com/mogzol/prisma-generator-typescript-interfaces/issues) page. I am actively using this package, so I'll try my best to address any issues that are reported. Alternatively, feel free to submit a PR.

## Developing

All the code for this generator is contained within the `src` directory. You can build the generator by running `npm install` then `npm run build`.

### Tests

You can run tests with `npm run test`. Tests are run using a custom script, see `test.ts` for details. You can add new tests by placing a Prisma schema and the expected output in a folder under the `tests` directory, you may want to look at the `tests/options-behavior` test as an example.

You can run specific tests by passing them as arguments to the test command:

```
npm run test -- options-behavior validation-errors
```

When a test fails, you can see the generated output in the `__TEST_TMP__` folder inside that test's directory. Compare this with the expected output to see why it failed.

Please ensure all tests are passing and that the code is properly linted (`npm run lint`) before submitting a PR, thanks!
