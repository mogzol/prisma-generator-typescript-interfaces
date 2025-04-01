# Custom Types

The generator provides options for customizing all types used in the output. You can also specify types on individual fields using [per-field types](#per-field-types). The default values for these options, which are compatible with the Prisma client types, are as follows:

| Option      |                Default Value                |
| :---------- | :-----------------------------------------: |
| stringType  |                  `string`                   |
| booleanType |                  `boolean`                  |
| intType     |                  `number`                   |
| floatType   |                  `number`                   |
| jsonType    | [`JsonValue`\*](#built-in-type-definitions) |
| dateType    |                   `Date`                    |
| bigIntType  |                  `bigint`                   |
| decimalType |  [`Decimal`\*](#built-in-type-definitions)  |
| bytesType   |                `Uint8Array`                 |

Any of these options can be changed to be whatever valid TypeScript type you want. For example, the following generator config would modify the types of all Decimal, DateTime, and Json fields:

```prisma
generator typescriptInterfaces {
  provider    = "prisma-generator-typescript-interfaces"
  decimalType = "number"
  dateType    = "{ year: number; month: number; day: number }"
  jsonType    = "Record<string, unknown>"
}

model MyData {
  myDecimal Decimal
  myDate    DateTime
  myJson    Json
}
```

It would output an interface like:

```typescript
export interface MyData {
  myDecimal: number;
  myDate: { year: number; month: number; day: number };
  myJson: Record<string, unknown>;
}
```

It should be noted that the generator does not perform any validation on these type options, so care should be taken to ensure you are specifying valid TypeScript types.

## Built-in Type Definitions

The default type options include two type definitions which are not pre-existing TypeScript types: `JsonValue` and `Decimal`. The definitions for these types are built-in to the generator, and will be included in the output when necessary:

```typescript
type JsonValue =
  | string
  | number
  | boolean
  | { [key in string]?: JsonValue }
  | Array<JsonValue>
  | null;

type Decimal = { valueOf(): string };
```

The `Decimal` type mainly exists for compatibility with the Prisma client, and only includes the `valueOf` function. You can cast to the Prisma client's `Decimal` type if you want to access the other methods.

## Advanced Custom Types

In addition to the basic usage where the types are generated in-line in the output, you can also specify types as either [defined types](#defined-types) or [imported types](#imported-types).

### Defined Types

Defined types will be created as a separate type definition in the output. They can be used by setting a type option to `TypeName:TypeDefinition`. For example:

```prisma
generator typescriptInterfaces {
  provider  = "prisma-generator-typescript-interfaces"
  intType   = "MyNumber:{ value: string; isNumber: boolean }"
  floatType = "MyNumber" // This will re-use the definition
}

model MyData {
  myInt   Int
  myFloat Float
}
```

Will output:

```typescript
export interface MyData {
  myInt: MyNumber;
  myFloat: MyNumber;
}

type MyNumber = { value: string; isNumber: boolean };
```

### Imported Types

Types can also be imported from an external file. This file is specified by the `typeImportPath` config option. The types being imported must be named exports in that file. Then, to specify an imported type, set a type option to `import:TypeName`.

> [!Note]
> The value of `typeImportPath` will be copied verbatim into the import statement, so it should be a path relative to the output location, and should have the file extension (or lack thereof) that you want to appear in the import statement.

For example:

```prisma
generator typescriptInterfaces {
  provider       = "prisma-generator-typescript-interfaces"
  typeImportPath = "./myTypes.js"
  stringType     = "import:MyString"
  intType        = "import:MyInteger"
}

model MyData {
  myString String
  myInt    Int
}
```

Will output:

```typescript
import { MyInteger, MyString } from "./myTypes.js";

export interface MyData {
  myString: MyString;
  myInt: MyInteger;
}
```

## Per-field Types

In addition to specifying custom types in the generator config options, they can also be specified on individual fields in the schema. This is done using a syntax similar to that used by [prisma-json-types-generator](https://www.npmjs.com/package/prisma-json-types-generator), where field types are specified by wrapping them in square brackets in the documentation of a field:

```prisma
generator typescriptInterfaces {
  provider       = "prisma-generator-typescript-interfaces"
  typeImportPath = "./myTypes.js"
}

model MyData {
  /// [MyJsonType]
  myJson Json

  /// ![boolean | "true" | "false"]
  myBoolean Boolean
}
```

Will output:

```typescript
import { MyJsonType } from "./myTypes.js";

export interface MyData {
  myJson: MyJsonType;
  myBoolean: boolean | "true" | "false";
}
```

Note that these types are treated as import types by default, and so require the `typeImportPath` option to be set. See [imported types](#imported-types) for more information.

You can also specify literal types by putting an exclamation point before the square bracket, like with `myBoolean` in that example. Doing this will cause the value inside the square brackets to be used directly as the type, and not be imported.

You can also use [defined types](#defined-types) with per-field types, using the same syntax, just inside the square brackets:

```prisma
generator typescriptInterfaces {
  provider       = "prisma-generator-typescript-interfaces"
  typeImportPath = "./myTypes.js"
}

model MyData {
  /// [MyDefinedType:Record<string, unknown>]
  myJson Json

  /// [MyDefinedType] - You can re-use the defined type
  otherJson Json
}
```

Will output:

```typescript
export interface MyData {
  myJson: MyDefinedType;
  otherJson: MyDefinedType;
}

type MyDefinedType = Record<string, unknown>;
```
