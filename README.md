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
  bytesType   = "BufferObject"
}
```

Note that `bigint` types don't have a default `toJSON` method, so the above assumes that you are converting them to strings somewhere along the line.

## Options

| **Option**            |                        **Type**                        |                                **Default**                                 | **Description**                                                                                                                                                                                       |
| --------------------- | :----------------------------------------------------: | :------------------------------------------------------------------------: | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| output                |                        `string`                        |                             `"interfaces.ts"`                              | The output location for the generated TypeScript interfaces.                                                                                                                                          |
| enumPrefix            |                        `string`                        |                                    `""`                                    | Prefix to add to enum types.                                                                                                                                                                          |
| enumSuffix            |                        `string`                        |                                    `""`                                    | Suffix to add to enum types.                                                                                                                                                                          |
| modelPrefix           |                        `string`                        |                                    `""`                                    | Prefix to add to model types.                                                                                                                                                                         |
| modelSuffix           |                        `string`                        |                                    `""`                                    | Suffix to add to model types.                                                                                                                                                                         |
| typePrefix            |                        `string`                        |                                    `""`                                    | Prefix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (MongoDB only).                                                       |
| typeSuffix            |                        `string`                        |                                    `""`                                    | Suffix to add to [type](https://www.prisma.io/docs/concepts/components/prisma-schema/data-model#defining-composite-types) types (MongoDB only).                                                       |
| headerComment         |                        `string`                        | `"This file was auto-generated by prisma-generator-typescript-interfaces"` | Sets the header comment added to the top of the generated file. Set this to an empty string to disable the header comment. Supports multiple lines with `"\n"`.                                       |
| modelType             |                `"interface" \| "type"`                 |                               `"interface"`                                | Controls how model definitions are generated. `"interface"` will create TypeScript interfaces, `"type"` will create TypeScript types. If using MongoDB, this also affects `type` definitions.         |
| enumType              |         `"stringUnion" \| "enum" \| "object"`          |                              `"stringUnion"`                               | Controls how enums are generated. `"object"` will create an object and type like the Prisma client, `"enum"` will create TypeScript enums, `"stringUnion"` will create a string union type.           |
| dateType              |            `"Date" \| "string" \| "number"`            |                                  `"Date"`                                  | The type to use for DateTime model fields.                                                                                                                                                            |
| bigIntType            |           `"bigint" \| "string" \| "number"`           |                                 `"bigint"`                                 | The type to use for BigInt model fields.                                                                                                                                                              |
| decimalType           |          `"Decimal" \| "string" \| "number"`           |                                `"Decimal"`                                 | The type to use for Decimal model fields. The `Decimal` type here is just an interface with a `valueOf()` function. You will need to cast to an actual Decimal type if you want to use other methods. |
| bytesType             | `"Buffer" \| "BufferObject" \| "string" \| "number[]"` |                                 `"Buffer"`                                 | The type to use for Bytes model fields. `BufferObject` is a type definition which matches the output of `Buffer.toJSON()`, which is called when running `JSON.stringify()` on a Buffer.               |
| optionalRelations     |                       `boolean`                        |                                   `true`                                   | Controls whether model relation fields are optional. If `true`, all model relation fields will use `?:` in the field definition.                                                                      |
| omitRelations         |                       `boolean`                        |                                  `false`                                   | Controls whether model relation fields are omitted. If `true`, model definitions will not include their relations.                                                                                    |
| optionalNullables     |                       `boolean`                        |                                  `false`                                   | Controls whether nullable fields are optional. Nullable fields are always defined with `\| null` in their type definition, but if this is `true`, they will also use `?:`.                            |
| prettier              |                       `boolean`                        |                                  `false`                                   | Formats the output using Prettier. Setting this to `true` requires that the `prettier` package is available.                                                                                          |
| resolvePrettierConfig |                       `boolean`                        |                                   `true`                                   | Tries to find and use a Prettier config file relative to the output location.                                                                                                                         |

## Example

Here is an example of a configuration that generates two separate outputs, `interfaces.ts` with types compatible with the Prisma client types, and a second `json-interfaces.ts` file with types matching the output of `JSON.stringify` when run on the models. Both files are output to the `src/dto` folder (which will be created if it doesn't exist) and are formatted using Prettier. The models in `json-interfaces.ts` also get a `Json` suffix attached to them.

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
  relationArrayField RelationC[]
}
```

</details>

#### Output

<details>
<summary>src/dto/interfaces.ts</summary>

```typescript
// This file was auto-generated by prisma-generator-typescript-interfaces

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
  relationArrayField?: RelationC[];
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
  relationArrayField?: RelationCJson[];
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

All the code for this generator is contained within the `generator.ts` file. You can build the generator by running `npm install` then `npm run build`.

### Tests

You can run tests with `npm run test`. Tests are run using a custom script, see `test.ts` for details. You can add new tests by placing a Prisma schema and the expected output in a folder under the `tests` directory, you may want to look at the `tests/options-behavior` test as an example.

You can run specific tests by passing them as arguments to the test command:

```
npm run test -- options-behavior validation-errors
```

When a test fails, you can see the generated output in the `__TEST_TMP__` folder inside that test's directory. Compare this with the expected output to see why it failed.

Please ensure all tests are passing and that the code is properly linted (`npm run lint`) before submitting a PR, thanks!
