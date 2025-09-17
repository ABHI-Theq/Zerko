import { auth } from "@/lib/auth";

export default async function Home() {
  const session=await auth();
  return (
    <>
    <div>
      {session?(
        <p>{session?.user?.id}</p>
      ):(
        <p>no user logged in</p>
      )}
      </div>
    </>
  );
}
