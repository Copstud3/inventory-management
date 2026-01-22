import fs from "fs";
import path from "path";
import { prisma } from "../lib/prisma";

/**
 * Delete all data in the tables in order
 */
async function deleteAllData(orderedFileNames: string[]) {
  const modelNames = orderedFileNames.map((fileName) => {
    const modelName = path.basename(fileName, path.extname(fileName));
    return modelName.charAt(0).toUpperCase() + modelName.slice(1);
  });

  for (const modelName of modelNames) {
    const model: any = prisma[modelName as keyof typeof prisma];
    if (model) {
      try {
        await model.deleteMany({ where: {} });
        console.log(`Cleared data from ${modelName}`);
      } catch (err) {
        console.error(`Failed to clear data from ${modelName}:`, err);
      }
    }
  }
}

/**
 * Seed a model from a JSON file
 * Special handling for ExpenseByCategory to map expenseSummaryId
 */
async function seedModelFromFile(filePath: string, modelName: string) {
  const model: any = prisma[modelName as keyof typeof prisma];

  if (!model) {
    console.warn(`No Prisma model matches the file name: ${filePath}`);
    return;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      console.log(`No data to seed for ${modelName}`);
      return;
    }

    let dataToInsert = jsonData;

    // Map expenseSummaryId for ExpenseByCategory dynamically
    if (modelName === "ExpenseByCategory") {
      const summaries = await prisma.expenseSummary.findMany();
      if (!summaries.length) {
        throw new Error(
          "No ExpenseSummary records found. Seed ExpenseSummary before ExpenseByCategory."
        );
      }

      dataToInsert = jsonData.map((item, index) => {
        const summary = summaries[index % summaries.length];
        if (!summary) {
          throw new Error(`Summary not found at index ${index % summaries.length}`);
        }
        return {
          category: item.category,
          amount: item.amount,
          date: new Date(item.date),
          expenseSummaryId: summary.expenseSummaryId,
        };
      });
    }

    await model.createMany({
      data: dataToInsert,
      skipDuplicates: true,
    });

    console.log(
      `Seeded ${modelName} with ${dataToInsert.length} records from ${path.basename(
        filePath
      )}`
    );
  } catch (err) {
    console.error(`Failed to seed ${modelName} from ${filePath}:`, err);
  }
}

async function main() {
  const dataDirectory = path.join(process.cwd(), "prisma", "seedData");

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

  console.log("Looking for seed files in:", dataDirectory);

  // 1️⃣ Clear all tables
  await deleteAllData(orderedFileNames);

  // 2️⃣ Seed tables
  for (const fileName of orderedFileNames) {
    const modelName = path.basename(fileName, path.extname(fileName))
      .charAt(0)
      .toUpperCase() + path.basename(fileName, path.extname(fileName)).slice(1);

    const filePath = path.join(dataDirectory, fileName);
    await seedModelFromFile(filePath, modelName);
  }
}

main()
  .catch((e) => {
    console.error("Seeding failed:", e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
