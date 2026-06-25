import fs from "fs/promises";
import path from "path";

export const writeAtomic = async (filePath, data) => {
  const ext = path.extname(filePath);
  const dir = path.dirname(filePath);
  const base = path.basename(filePath, ext);
  const tmpPath = path.join(dir, `${base}.tmp${ext}`);

  try {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(tmpPath, JSON.stringify(data, null, 2), "utf8");
    await fs.rename(tmpPath, filePath);
  } catch (error) {
    try {
      await fs.unlink(tmpPath);
    } catch (unlinkError) {
      if (unlinkError.code !== "ENOENT") {
        throw unlinkError;
      }
    }
    throw error;
  }
};

export const runBackup = async (logger) => {
  const itemsDir = path.join(process.cwd(), "data", "items");
  const backupsDir = path.join(process.cwd(), "data", "backups");
  const timestamp = Date.now().toString();
  const currentBackupDir = path.join(backupsDir, timestamp);

  try {
    await fs.access(itemsDir);
  } catch {
    return;
  }

  const files = await fs.readdir(itemsDir);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  if (jsonFiles.length === 0) return;

  await fs.mkdir(currentBackupDir, { recursive: true });

  for (const file of jsonFiles) {
    await fs.copyFile(
      path.join(itemsDir, file),
      path.join(currentBackupDir, file)
    );
  }

  logger.info(`[BACKUP] Backup successfully saved to ${timestamp}`);

  const allBackups = await fs.readdir(backupsDir);
  const sortedBackups = allBackups.sort((a, b) => Number(a) - Number(b));

  while (sortedBackups.length > 5) {
    const oldBackup = sortedBackups.shift();
    await fs.rm(path.join(backupsDir, oldBackup), { recursive: true });
    logger.info(`[BACKUP] Obsolete backup removed: ${oldBackup}`);
  }
};
