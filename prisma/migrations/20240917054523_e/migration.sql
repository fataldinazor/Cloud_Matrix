/*
  Warnings:

  - You are about to drop the column `private` on the `File` table. All the data in the column will be lost.
  - Added the required column `url` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP COLUMN "private",
ADD COLUMN     "url" VARCHAR(511) NOT NULL;
