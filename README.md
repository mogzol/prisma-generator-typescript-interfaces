# Prisma Typescript Interfaces Generator

`prisma-generator-typescript-interfaces` - A [Prisma generator](https://www.prisma.io/docs/concepts/components/prisma-schema/generators) which creates zero-dependency Typescript interfaces from Prisma schema.

## Motivation

The generated Prisma client types are generally sufficient for most use cases, however there are some some scenarios where using them is not convenient or possible, due to the fact that they rely on both the `@prisma/client` package and on the client generated from your prisma schema. That is where this generator comes in to play. It generates a zero-dependency Typescript file containing type definitions for all your models. Zero-dependency in this case means that the file does not import any other packages, and can be used standalone in any Typescript app. By default the definitions are [type compatible](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) with the Prisma client types, however this can be customized via the [options](#options), see below for more info.

As example of why this is useful, say have an API which uses Prisma and responds with models from your DB, and you want to create a DTO package with Typescript definitions for all the data your API returns. You wouldn't really want to include your entire generated Prisma client in that package, and you don't want to require users to install `@prisma/client` just to use your DTO. So instead, you can use this generator to create a zero-dependency typescript file containing definitions for all your models, and then use that in your DTO package.

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

By default that will output the Typescript interface definitions to a file called `interfaces.ts` in your `prisma` folder, this can be changed by specifying the `output` option. As mentioned above, by default the generated types will be [type compatible](https://www.typescriptlang.org/docs/handbook/type-compatibility.html) with the Prisma client types. If you instead wanted to generate types matching `JSON.stringify`-ed versions of your models, you will need to use some of the options to change the output behavior:

```prisma
generator typescriptInterfaces {
  provider    = "prisma-generator-typescript-interfaces"
  dateType    = "string"
  bigIntType  = "string"
  decimalType = "string"
  bytesType   = "BufferObject"
}
```

## Options

| **Option**        |                        **Type**                        |    **Default**    | **Description**                                                                                                                                                                                                  |
| ----------------- | :----------------------------------------------------: | :---------------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| output            |                        `string`                        | `"interfaces.ts"` | The output location for the generated Typescript interfaces.                                                                                                                                                     |
| enumPrefix        |                        `string`                        |       `""`        | Prefix to add to enum types.                                                                                                                                                                                     |
| enumSuffix        |                        `string`                        |       `""`        | Suffix to add to enum types.                                                                                                                                                                                     |
| modelPrefix       |                        `string`                        |       `""`        | Prefix to add to enum types.                                                                                                                                                                                     |
| modelSuffix       |                        `string`                        |       `""`        | Suffix to add to model types.                                                                                                                                                                                    |
| typePrefix        |                        `string`                        |       `""`        | Prefix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (mongodb only).                                                                  |
| typeSuffix        |                        `string`                        |       `""`        | Suffix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (mongodb only).                                                                  |
| enumType          |               `"stringUnion" \| "enum"`                |  `"stringUnion"`  | Controls how enums are generated. `"enum"` will create Typescript enums, `"stringUnion"` will create union types with all the enum values.                                                                       |
| dateType          |                  `"Date" \| "string"`                  |     `"Date"`      | The type to use for DateTime model fields.                                                                                                                                                                       |
| bigIntType        |           `"bigint" \| "string" \| "number"`           |    `"bigint"`     | The type to use for BigInt model fields.                                                                                                                                                                         |
| decimalType       |                `"Decimal" \| "string"`                 |    `"Decimal"`    | The type to use for Decimal model fields. Note that the `Decimal` type here is just an interface with a `getValue()` function. You will need to cast to an actual Decimal type if you want to use other methods. |
| bytesType         | `"Buffer" \| "BufferObject" \| "string" \| "number[]"` |    `"Buffer"`     | The type to use for Bytes model fields. `BufferObject` is a type definition which matches the output of `Buffer.toJSON()`, which is called when running `JSON.stringify()` on a Buffer.                          |
| optionalRelations |                       `boolean`                        |      `true`       | Controls whether model relation fields are optional or not. If `true`, all model relation fields will use `?:` in the field definition.                                                                          |
| prettier          |                       `boolean`                        |      `false`      | Formats the output using Prettier. Setting this to `true` requires that the `prettier` package is available. [Prettier settings files](https://prettier.io/docs/en/configuration.html) will be respected.        |

## Example

Here is an example of a configuration which generates two separate outputs, `interfaces.ts` with types compatible with the Prisma client types, and a second `json-interfaces.ts` file with types matching the output of `JSON.stringify` when run on the models. Both files are output to the `src/dto` folder (which will be created if it doesn't exist) and are formatted using Prettier. The models in `json-interfaces.ts` get a `Json` suffix attached to them.

#### Input

<details>
<summary>prisma/schema.prisma</summary>

```prisma
datasource db {
  provider = "postgresql"
  url      = "postgresql://postgres:postgres@localhost:5432/example?schema=public"
}

generator client {
  provider = "prisma-client-js"
}

generator typescriptInterfaces {
  provider = "prisma-generator-typescript-interfaces"
  output = "../src/dto/interfaces.ts"
  prettier = true
}

generator typescriptInterfacesJson {
  provider = "prisma-generator-typescript-interfaces"
  output = "../src/dto/json-interfaces.ts"
  modelSuffix = "Json"
  dateType = "string"
  bigIntType = "string"
  decimalType = "string"
  bytesType = "BufferObject"
  prettier = true
}

enum Fruits {
  Apple
  Banana
  Orange
  Pear
}

model RelationA {
  id Int @id
  Data Data[]
}

model RelationB {
  id Int @id
  dataId Int @unique
  data Data @relation(fields: [dataId], references: [id])
}

model RelationC {
  id Int @id
  dataId Int
  data Data @relation(fields: [dataId], references: [id])
}

model Data {
  id Int @id
  stringField String
  booleanField Boolean
  intField Int
  bigIntField BigInt
  floatField Float
  decimalField Decimal
  dateField DateTime
  jsonField Json
  bytesField Bytes
  enumField Fruits
  relationId Int
  relationField RelationA @relation(fields: [relationId], references: [id])

  optionalStringField String?
  optionalBooleanField Boolean?
  optionalIntField Int?
  optionalBigIntField BigInt?
  optionalFloatField Float?
  optionalDecimalField Decimal?
  optionalDateField DateTime?
  optionalJsonField Json?
  optionalBytesField Bytes?
  optionalEnumField Fruits?
  optionalRelationField RelationB?

  stringArrayField String[]
  booleanArrayField Boolean[]
  intArrayField Int[]
  bigIntArrayField BigInt[]
  floatArrayField Float[]
  decimalArrayField Decimal[]
  dateArrayField DateTime[]
  jsonArrayField Json[]
  bytesArrayField Bytes[]
  enumArrayField Fruits[]
  relationArray RelationC[]
}
```

</details>

#### Output

<details>
<summary>src/interfaces.ts</summary>

```typescript
export type Fruits = "Apple" | "Banana" | "Orange" | "Pear";

export interface RelationA {
  id: number;
  Data?: Data[];
}

export interface RelationB {
  id: number;
  dataId: number;
  data?: Data;
}

export interface RelationC {
  id: number;
  dataId: number;
  data?: Data;
}

export interface Data {
  id: number;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: bigint;
  floatField: number;
  decimalField: Decimal;
  dateField: Date;
  jsonField: JsonValue;
  bytesField: Buffer;
  enumField: Fruits;
  relationId: number;
  relationField?: RelationA;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: bigint | null;
  optionalFloatField: number | null;
  optionalDecimalField: Decimal | null;
  optionalDateField: Date | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: Buffer | null;
  optionalEnumField: Fruits | null;
  optionalRelationField?: RelationB | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: bigint[];
  floatArrayField: number[];
  decimalArrayField: Decimal[];
  dateArrayField: Date[];
  jsonArrayField: JsonValue[];
  bytesArrayField: Buffer[];
  enumArrayField: Fruits[];
  relationArray?: RelationC[];
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
<summary>src/json-interfaces.ts</summary>

```typescript
export type Fruits = "Apple" | "Banana" | "Orange" | "Pear";

export interface RelationAJson {
  id: number;
  Data?: DataJson[];
}

export interface RelationBJson {
  id: number;
  dataId: number;
  data?: DataJson;
}

export interface RelationCJson {
  id: number;
  dataId: number;
  data?: DataJson;
}

export interface DataJson {
  id: number;
  stringField: string;
  booleanField: boolean;
  intField: number;
  bigIntField: string;
  floatField: number;
  decimalField: string;
  dateField: string;
  jsonField: JsonValue;
  bytesField: BufferObject;
  enumField: Fruits;
  relationId: number;
  relationField?: RelationAJson;
  optionalStringField: string | null;
  optionalBooleanField: boolean | null;
  optionalIntField: number | null;
  optionalBigIntField: string | null;
  optionalFloatField: number | null;
  optionalDecimalField: string | null;
  optionalDateField: string | null;
  optionalJsonField: JsonValue | null;
  optionalBytesField: BufferObject | null;
  optionalEnumField: Fruits | null;
  optionalRelationField?: RelationBJson | null;
  stringArrayField: string[];
  booleanArrayField: boolean[];
  intArrayField: number[];
  bigIntArrayField: string[];
  floatArrayField: number[];
  decimalArrayField: string[];
  dateArrayField: string[];
  jsonArrayField: JsonValue[];
  bytesArrayField: BufferObject[];
  enumArrayField: Fruits[];
  relationArray?: RelationCJson[];
}

type JsonValue =
  | string
  | number
  | boolean
  | { [key in string]?: JsonValue }
  | Array<JsonValue>
  | null;

type BufferObject = { type: "Buffer"; data: number[] };
```

</details>

## Issues

Please report any issues to the [issues](https://github.com/mogzol/prisma-generator-typescript-interfaces/issues) page. I am actively using this package, so I'll try my best to address any issues that are reported. Alternatively, feel free to submit a PR.

## Developing

As this is a fairly simple generator, all the code is contained within the `generator.ts` file. You can build the generator by running `npm install` then `npm run build`.

### Tests

You can run tests with `npm run test`. Tests are run using a custom script, see `test.ts` for details. You can add new tests by placing a prisma schema and the expected output in a folder under the `tests` directory, you may want to look at the `tests/no-options` test as an example.

You can run specific tests by passing them as arguments to the test command:

```
npm run test -- buffer-array-type mongo-types required-relations
```

When a test fails, you can see the generated output in a `__TEST_TMP__` folder inside the test's directory. Compare this with the expected output to see why it failed.

By default the test runner will quit when it encounters it's first failure. If you want it to continue after failures, use the `-c` (or `--continue`) option:

```
npm run test -- -c
```

Please ensure all tests are passing and that the code is properly linted (`npm run lint`) before submitting a PR, thanks!
