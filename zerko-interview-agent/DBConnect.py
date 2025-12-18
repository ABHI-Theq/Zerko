from prisma import Prisma
import asyncio

async def DBConnect():
    db=Prisma()
    await db.connect()
    return db

