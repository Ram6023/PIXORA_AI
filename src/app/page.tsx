import Generator from "@/components/generator";
import SwipeGrid from "@/components/Pics";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center">
      <Generator />
      <SwipeGrid />
      <div className="fixed text-sm md:text-base p-2 backdrop-blur-md rounded right-2 border border-zinc-700/30 shadow bottom-1 text-center text-gray-500 z-50">
        <p>
          © Made with ❤️ by{" "}
          <span className="text-zinc-200">
            RAMM
          </span>{" "}
        </p>
      </div>
    </main>
  );
}
