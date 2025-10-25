import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";
import Footer from "./Footer";

export function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Navbar />
      <div className="flex flex-1 w-full">
        <Sidebar />
        <main className="flex-1 p-6 bg-gradient-mesh overflow-auto">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
}
