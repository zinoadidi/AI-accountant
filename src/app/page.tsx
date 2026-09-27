import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { MuiTheme } from "@/components/MuiTheme";
import { Landing } from "./landing";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <MuiTheme>
      <Landing authed={!!session} />
    </MuiTheme>
  );
}
