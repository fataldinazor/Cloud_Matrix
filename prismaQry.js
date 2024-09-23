// import {PrismaClient} from "@prisma/client"
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

 async function main(){
  await prisma.file.deleteMany({})
 }

 main().then(async()=>{
    await prisma.$disconnect()
 })
 .catch(async (err) => {
   console.error("Error connecting to database", err)
   await prisma.$disconnect()
   process.exit(1)
 })