import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { BookModel } from "#models/book.model";
import { writeAtomic } from "#utils/fs.utils";

export const getModelHash = () => {
  return crypto
    .createHash("md5")
    .update(JSON.stringify(BookModel))
    .digest("hex");
};

const migrate = async () => {
  const itemsDir = path.join(process.cwd(), "data", "items");
  const versionPath = path.join(process.cwd(), "data", "version.json");
  const currentHash = getModelHash();

  try {
    await fs.mkdir(path.dirname(versionPath), { recursive: true });
  } catch (error) {
    if (error.code !== "EEXIST") {
      throw error;
    }
  }

  let files = [];
  try {
    files = await fs.readdir(itemsDir);
  } catch {
    await writeAtomic(versionPath, { hash: currentHash });
    return;
  }

  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  for (const file of jsonFiles) {
    const filePath = path.join(itemsDir, file);
    const content = await fs.readFile(filePath, "utf8");
    const book = JSON.parse(content);

    let updated = false;
    for (const key of Object.keys(BookModel)) {
      if (book[key] === undefined) {
        book[key] = BookModel[key];
        updated = true;
      }
    }

    if (updated) {
      await writeAtomic(filePath, book);
    }
  }

  await writeAtomic(versionPath, { hash: currentHash });
};

migrate().catch(() => process.exit(1));
