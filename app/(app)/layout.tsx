import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex h-screen bg-[#0f0f0f]">
      <Sidebar profile={profile} />
      <main className="flex-1 overflow-y-auto md:ml-60 pb-20 md:pb-0">
        <ToastProvider>
          <div className="p-6">{children}</div>
        </ToastProvider>
      </main>
    </div>
  );
}
