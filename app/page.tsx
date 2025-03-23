import Chat from "@/app/components/Chat";

export default function Home() {
  return (
    <main className="container mx-auto">
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-4 border-b">
          <h1 className="text-xl font-semibold text-black">
            Welcome to the Chat Application
          </h1>
        </div>
        <Chat />
      </div>
    </main>
  );
}
