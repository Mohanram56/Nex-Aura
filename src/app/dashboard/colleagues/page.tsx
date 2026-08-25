import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getColleaguesList } from "./actions";
import ColleaguesClient from "./ColleaguesClient";

export default async function ColleaguesPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    redirect("/login");
  }

  const colleagues = await getColleaguesList();

  return <ColleaguesClient colleagues={JSON.parse(JSON.stringify(colleagues))} />;
}
