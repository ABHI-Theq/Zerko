import asyncio
from prisma import Prisma

async def main() -> None:
    db = Prisma()
    
    try:
        print("Connecting to Neon...")
        await db.connect()
        print("Successfully connected!")
        
        # Example: Fetch first 5 records from a table named 'User'
        # Change 'user' to match a model in your schema.prisma
        # users = await db.user.find_many(take=5)
        # print(f"Found {len(users)} users")
        
    except Exception as e:
        print(f"Error: {e}")
        
    finally:
        if db.is_connected():
            await db.disconnect()

if __name__ == '__main__':
    asyncio.run(main())