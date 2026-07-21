import { redirect } from "next/navigation";

export default function LoginRedirect({
  params: { locale },
}: {
  params: { locale: string };
}) {
  redirect(`/${locale}/auth/login`);
}
