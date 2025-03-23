import { Config } from "./config.js";

// Define some common custom types as built-in so that users don't need to manually define them.
// TODO: remove ArrayObject/BufferObject
const BUILTIN_CUSTOM_TYPES = {
  ArrayObject: "{ [index: number]: number } & { length?: never }",
  BufferObject: '{ type: "Buffer"; data: number[] }',
  Decimal: "{ valueOf(): string }",
  JsonValue:
    "string | number | boolean | { [key in string]?: JsonValue } | Array<JsonValue> | null",
};

const importTypeRegex = /^import:([\w$]+):(.+)$/;
const definedTypeRegex = /^([\w$]+):(.+)$/;

// A type is considered complex if contains a union (|), intersection (&), conditional (?), or
// function (=>) anywhere in the type. This will catch cases that don't necessarily need to be
// marked complex, such as "Record<string, string | number>", but it doesn't cause any harm to wrap
// those in parenthesis, and detecting and excluding all such cases would be too complex.
const complexTypeRegex = /[|&\?]|=>/;

const localeSort = (a: string, b: string) => a.localeCompare(b);

interface CustomType {
  type: string;
  definition?: string;
  import?: string;
  builtIn?: boolean;
}

export class CustomTypes {
  private typeMap: { [type: string]: CustomType };
  private usedTypes = new Set<CustomType>();

  // This cache is used to ensure that only one CustomType type exists per type name. Import types
  // take precedence over defined types, which take precedence over built-in types, which take
  // precedence over inline types.
  private typeCache = new Map<string, CustomType>();

  constructor(public config: Config) {
    this.typeMap = {
      String: this.getCustomType(this.config.stringType),
      Boolean: this.getCustomType(this.config.booleanType),
      Int: this.getCustomType(this.config.intType),
      Float: this.getCustomType(this.config.floatType),
      Json: this.getCustomType(this.config.jsonType),
      DateTime: this.getCustomType(this.config.dateType),
      BigInt: this.getCustomType(this.config.bigIntType),
      Decimal: this.getCustomType(this.config.decimalType),
      Bytes: this.getCustomType(this.config.bytesType),
    };
  }

  private upsertCachedType(customType: CustomType) {
    const cached = this.typeCache.get(customType.type);
    if (!cached) {
      this.typeCache.set(customType.type, customType);
      return customType;
    }

    // Built-in and inline types have the lowest priority, they will never override a cached type.
    // Import types have the highest priority, they will always override a cached type.
    // Defined types will only override a cached type if the cached type is not an import.
    if (!customType.builtIn && (customType.import || (customType.definition && !cached.import))) {
      // Update the existing object
      cached.definition = customType.definition;
      cached.import = customType.import;
      cached.builtIn = false;
    }

    return cached;
  }

  private getCustomType(configType: string): CustomType {
    const importMatch = importTypeRegex.exec(configType);
    if (importMatch) {
      return this.upsertCachedType({
        type: importMatch[1],
        import: importMatch[2],
      });
    }

    const definedMatch = definedTypeRegex.exec(configType);
    if (definedMatch) {
      return this.upsertCachedType({
        type: definedMatch[1],
        definition: definedMatch[2],
      });
    }

    const builtIn = BUILTIN_CUSTOM_TYPES[configType as keyof typeof BUILTIN_CUSTOM_TYPES];
    return this.upsertCachedType({
      type: configType,
      definition: builtIn,
      builtIn: Boolean(builtIn),
    });
  }

  /**
   * Get the TypeScript type from a Prisma scalar type.
   *
   * The `wrapComplex` option should be `true` if the returned type definition will be modified,
   * like when adding `| null` for a nullable type, or `[]` for an array type. It wraps the type in
   * parenthesis to ensure that the modification applies to the entire custom type. For example,
   * if the type is `string | number`, and we are adding `[]` to turn it into an array, this ensures
   * the type ends up as `(string | number)[]` and not `string | number[]`.
   */
  getTsType(prismaType: string, wrapComplex: boolean): string {
    const type = this.typeMap[prismaType];
    if (!type) {
      throw new Error(`Unknown scalar type: ${prismaType}`);
    }

    this.usedTypes.add(type);

    return wrapComplex && complexTypeRegex.test(type.type) ? `(${type.type})` : type.type;
  }

  /** Get the TypeScript imports for all used types */
  getTypeImports(): string[] {
    const importTypes = Array.from(this.usedTypes).filter((t) => t.import !== undefined);
    const importMap = new Map<string, string[]>();
    for (const importType of importTypes) {
      const existing = importMap.get(importType.import!) ?? [];
      existing.push(importType.type);
      importMap.set(importType.import!, existing);
    }

    return Array.from(importMap)
      .sort(([a], [b]) => localeSort(a, b))
      .map(
        ([importPath, types]) =>
          `import { ${types.sort(localeSort).join(", ")} } from "${importPath}"`,
      );
  }

  /** Get the TypeScript type definitions for used types */
  getTypeDefinitions(): string[] {
    return Array.from(this.usedTypes)
      .filter((t) => t.definition !== undefined)
      .map((t) => `type ${t.type} = ${t.definition};`);
  }
}
