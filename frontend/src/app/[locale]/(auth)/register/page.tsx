import { redirect } from "next/navigation";

export default function RegisterRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/auth/register`);
}
