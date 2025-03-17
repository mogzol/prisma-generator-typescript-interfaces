// This test verifies that the generated types are type-compatible with the Prisma client types.
// When this test runs, this file will get type-checked by typescript to ensure there are no errors

import * as Interfaces from "./__TEST_TMP__/interfaces.js";
import * as Prisma from "./__TEST_TMP__/client/index.js";

// Check that all the types are type-compatible
const fruits: Interfaces.Fruits = {} as Prisma.Fruits;
const relationA: Interfaces.RelationA = {} as Prisma.RelationA;
const relationB: Interfaces.RelationB = {} as Prisma.RelationB;
const relationC: Interfaces.RelationC = {} as Prisma.RelationC;
const data: Interfaces.Data = {} as Prisma.Data;

// The above should catch all issues, but we'll also do a sanity check here to ensure that the
// result of a query for Data is also compatible with the generated interface
const client = new Prisma.PrismaClient();
const queryResult = await client.data.findUnique({ where: { id: 1 }, include: {
  relationField: true,
  optionalRelationField: true,
  relationArrayField: true,
}});

const castedResult: Interfaces.Data = queryResult!;
