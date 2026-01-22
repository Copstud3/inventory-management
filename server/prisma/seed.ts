import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    if (model) {
      try {
        await model.deleteMany({ where: {} }); // RDS-safe
        console.log(`Cleared data from ${modelName}`);
      } catch (err) {
        console.error(`Failed to clear data from ${modelName}:`, err);
      }
    } else {
      console.warn(
        `Model ${modelName} not found. Check your Prisma schema or file naming.`
      );
    }
  }
}

async function seedModelFromFile(filePath: string) {
  const fileName = path.basename(filePath);
  const modelName = path.basename(fileName, path.extname(fileName));
  const model: any = prisma[modelName as keyof typeof prisma];

  if (!model) {
    console.warn(`No Prisma model matches the file name: ${fileName}`);
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.log(`No data to seed for ${modelName}`);
      return;
    }

    // Batch insert for performance
    await model.createMany({
      data: jsonData,
      skipDuplicates: true, // prevents errors if unique constraints exist
    });

    console.log(`Seeded ${modelName} with ${jsonData.length} records from ${fileName}`);
  } catch (err) {
    console.error(`Failed to seed ${modelName} from ${fileName}:`, err);
  }
}

async function main() {
  const dataDirectory = path.resolve(__dirname, "seedData");

  const orderedFileNames = [
    "products.json",
    "expenseSummary.json",
    "sales.json",
    "salesSummary.json",
    "purchases.json",
    "purchaseSummary.json",
    "users.json",
    "expenses.json",
    "expenseByCategory.json",
  ];

  // 1️⃣ Clear all tables
  await deleteAllData(orderedFileNames);

  // 2️⃣ Seed tables
  for (const fileName of orderedFileNames) {
    const filePath = path.join(dataDirectory, fileName);
    await seedModelFromFile(filePath);
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
