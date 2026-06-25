import fs from "fs/promises";
import path from "path";
import { writeAtomic } from "#utils/fs.utils";

const INITIAL_BOOKS = [
  {
    id: 1,
    title: "Kobzar",
    author: "Shevchenko",
    year: 1840,
    genre: "Poetry",
    image: null
  },
  {
    id: 2,
    title: "Eneida",
    author: "Kotliarevsky",
    year: 1798,
    genre: "Epic",
    image: null
  },
  {
    id: 3,
    title: "Chorna Rada",
    author: "Kulish",
    year: 1857,
    genre: "Historical",
    image: null
  }
];

const seed = async () => {
  const itemsDir = path.join(process.cwd(), "data", "items");

  await fs.rm(itemsDir, { recursive: true, force: true });
  await fs.mkdir(itemsDir, { recursive: true });

  for (const book of INITIAL_BOOKS) {
    const filePath = path.join(itemsDir, `${book.id}.json`);
    await writeAtomic(filePath, book);
  }
};

seed().catch(() => process.exit(1));
