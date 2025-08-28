# Custom Types

This generator provides options for customizing all types used in the output. The default values for these options, which are compatible with the Prisma client types, are as follows:

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

All of these options can be changed to whatever TypeScript type definition you want.

> [!Note]
> It is also possible to specify types on individual fields, see [per-field types](#per-field-types) for more information.

As an example, the following generator config would modify the types of all Decimal, DateTime, and Json fields:

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

It should be noted that the types from the options will be copied verbatim into the generated output without any validation, so care should be taken to ensure you are specifying valid types.

## Built-in Type Definitions

The default type options include two type definitions which are not pre-existing TypeScript types: `JsonValue` and `Decimal`. The definitions for these types are built in to the generator, and will be included in the output when necessary:

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

In addition to the basic usage described above, you can also specify types as either [defined types](#defined-types) or [imported types](#imported-types).

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

In addition to specifying custom types in the generator config options, they can also be specified on individual fields in the schema, as long as the `perFieldTypes` option is `true` (which is the default). Per-field types use a syntax similar to that used by [prisma-json-types-generator](https://www.npmjs.com/package/prisma-json-types-generator), where field types are specified in square brackets in the documentation of a field:

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

Per-field types must be specified in documentation comments (with a triple-slash, like `///`) and not normal comments (`//`). If a field has multiple lines of documentation, the per-field type comment must be the final line, and that line must not have any text before the type.

> [!Note]
> If the `includeComments` option is enabled, the per-field type documentation line will not be included in the generated comment.

There are two ways you can specify a type using per-field types:

- Regular type annotations, which are wrapped in square brackets (`[` `]`)
- Literal type annotations, which are wrapped in square brackets with an exclamation point at the start (`![` `]`).

Regular type annotations, like with `myJson` in the example, are treated as imported types and require the `typeImportPath` option to be set. See [imported types](#imported-types) for more information.

Literal type annotations, like with `myBoolean` in that example, are used directly as the type. Everything between the first and last square bracket in the documentation will be copied verbatim into the field's type definition.

You can also use [defined types](#defined-types) with per-field types, using the same syntax as before, just inside the square brackets:

```prisma
generator typescriptInterfaces {
  provider       = "prisma-generator-typescript-interfaces"
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
