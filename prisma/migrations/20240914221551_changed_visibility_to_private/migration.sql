/*
  Warnings:

  - You are about to drop the column `visibility` on the `File` table. All the data in the column will be lost.
  - You are about to drop the column `visibility` on the `Folder` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "visibility",
ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Folder" DROP COLUMN "visibility",
ADD COLUMN     "private" BOOLEAN NOT NULL DEFAULT false;
