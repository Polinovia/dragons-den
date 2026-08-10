import { SiteShell } from "@/components/nav/SiteShell";

export default function ContentLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell>{children}</SiteShell>;
}
