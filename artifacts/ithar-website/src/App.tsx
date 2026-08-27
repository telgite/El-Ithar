import { useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Navbar } from "@/components/Navbar";
import { Hero } from "@/components/Hero";
import { About } from "@/components/About";
import { Quote } from "@/components/Quote";
import { Activities } from "@/components/Activities";
import { Gallery } from "@/components/Gallery";
import { Impact } from "@/components/Impact";
import { Contact } from "@/components/Contact";
import { Footer } from "@/components/Footer";
import { AdminApp } from "./admin/AdminApp";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
    },
  },
});

function PublicWebsite() {
  return (
    <div dir="rtl" lang="ar">
      <Navbar />
      <Hero />
      <About />
      <Quote />
      <Activities />
      <Gallery />
      <Impact />
      <Contact />
      <Footer />
    </div>
  );
}

function AppRouter() {
  const [location] = useLocation();

  if (location.startsWith("/admin")) {
    return <AdminApp />;
  }

  return <PublicWebsite />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppRouter />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
