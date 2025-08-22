# 3.0.0

- **This release is still in development!**

### BREAKING CHANGES:

- `omitRelations` and `optionalRelations` have been replaced with just `relations`, which can be set to either `required`, `optional`, or `none`.
- The `BufferObject` and `ArrayObject` built-in types have been removed from `bytesType`. Their behavior can be replicated using custom types:
  <!-- prettier-ignore -->
  ```prisma
  generator typescriptInterfaces {
    provider = "prisma-generator-typescript-interfaces"
     
    // To get the old 'BufferObject' behavior:
    bytesType = "BufferObject:{ type: \"Buffer\"; data: number[] }"
     
    // To get the old 'ArrayObject' behavior:
    bytesType = "ArrayObject:{ [index: number]: number } & { length?: never }"
  }
  ```
- The `resolvePrettierConfig` option has been replaced with `prettierConfigPath`, which allows you to specify a specific Prettier config file. If this option is empty (the default), then the behavior will be the same as before, where the Prettier config file will be resolved relative to the output location. Set the option to `null` to disable using Prettier config files altogether.
- The new [per-field types feature](CUSTOM_TYPES.md#per-field-types) is enabled by default. If your Prisma schema contains compatible type annotations in your field documentation, they will be used and the output will be different from previous releases. If you don't want this behavior, set the `perFieldTypes` config option to `false`.

### New Features:

- Allow full control over the types used during generation, including allowing per-field types. See [Custom Types](CUSTOM_TYPES.md) for details.
  - Thanks [@helmturner](https://github.com/helmturner) for the initial per-field types work
- Add the `includeComments` option to include documentation from the schema in the generated output (thanks [@samelie](@samelie))
- Add the `counts` option to include the `_count` field on models with relations. It can be set to either `required`, `optional`, or `none`.
- Improve config validation and generator error messages. The generator name is now included in all errors since Prisma doesn't make it clear which generator an error is coming from.

## 2.1.0

- Stop enum fields from being marked `readonly` when using `enumType = "object"` - [#14](https://github.com/mogzol/prisma-generator-typescript-interfaces/pull/14)
  - Note that this is a **breaking change** if you are using TypeScript < 4.9, as it uses the `satisfies` keyword. Either upgrade TypeScript or use a different `enumType`.
- Add `enumObjectSuffix` and `enumObjectPrefix` options - [#14](https://github.com/mogzol/prisma-generator-typescript-interfaces/pull/14)
- Add `exportEnums` option - [#15](https://github.com/mogzol/prisma-generator-typescript-interfaces/pull/15)
- Thanks [@helmturner](https://github.com/helmturner) for these changes!

## 2.0.1

- Fix README.md example, and re-order the README.md sections.

# 2.0.0

- **BREAKING CHANGE**: Add `Uint8Array` option for `bytesType`, and make it the default. This is to match the changes made in [Prisma v6](https://www.prisma.io/docs/orm/more/upgrade-guides/upgrading-versions/upgrading-to-prisma-6#usage-of-buffer). If you are still using Prisma v5 and want the generated types to be type-compatible with the Prisma client, you will now need to explicitly set `bytesType` to `Buffer`.
- Add `ArrayObject` option for `bytesType`, which matches the output of running `JSON.stringify` on a `Uint8Array`.
- Update dependency declaration for `@prisma/generator-helper` to allow either v5 or v6 of the library, as either will work.

## 1.7.0

- Add `resolvePrettierConfig` option - [#9](https://github.com/mogzol/prisma-generator-typescript-interfaces/pull/9) (thanks [@adrian-rom64](https://github.com/adrian-rom64))

## 1.6.1

- No code changes since 1.6.0, this is just a documentation update.

## 1.6.0

- Add `optionalNullables` option

## 1.5.0

- Add `object` enumType option that matches Prisma client's enum definitions ([#6](https://github.com/mogzol/prisma-generator-typescript-interfaces/pull/6))

## 1.4.0

- Add `omitRelations` option to omit model relation fields in the generated file

## 1.3.0

- Add `modelType` option to control whether the model definitions are outputted as TypeScript interfaces or types

## 1.2.0

- Add shebang to script, should fix several compatibility issues
- Fix compatibility with `@prisma/generator-helper` v5.7.0
- Update dependencies to their latest version
- Allow `number` types for Date and Decimal (though obviously not recommended if you care about precision)

## 1.1.1

- Add repository info to package.json

## 1.1.0

- Added a header comment to generated output, configurable with the new headerComment option.
- Improved tests

## 1.0.1

- No code changes, just updating the README and package.json

# 1.0.0

- Initial release
