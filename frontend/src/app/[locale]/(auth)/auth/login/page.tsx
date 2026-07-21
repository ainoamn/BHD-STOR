"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams, useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion } from "framer-motion";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

import { useLogin } from "@/hooks/useAuth";
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const t = useTranslations("auth.login");
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || "ar";
  const returnUrl =
    searchParams.get("returnUrl") ||
    searchParams.get("redirect") ||
    `/${locale}`;
  const registered = searchParams.get("registered");

  const [formData, setFormData] = useState<LoginFormData>({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const loginMutation = useLogin();

  useEffect(() => {
    if (registered === "true") {
      toast.success(t("registerSuccess"), {
        description: t("registerSuccessDesc"),
      });
    }
  }, [registered, t]);

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateField = useCallback(
    (field: keyof LoginFormData, value: string) => {
      const result = loginSchema.shape[field].safeParse(value);
      if (!result.success) {
        setErrors((prev) => ({ ...prev, [field]: result.error.errors[0].message }));
        return false;
      }
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
      return true;
    },
    []
  );

  const validateForm = useCallback(() => {
    const result = loginSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof LoginFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof LoginFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [formData]);

  const handleChange = useCallback(
    (field: keyof LoginFormData, value: string) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        validateField(field, value);
      }
    },
    [errors, validateField]
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    loginMutation.mutate(
      {
        email: formData.email,
        password: formData.password,
      },
      {
        onSuccess: (data) => {
          if (rememberMe) {
            localStorage.setItem("rememberedEmail", formData.email);
          } else {
            localStorage.removeItem("rememberedEmail");
          }

          toast.success(t("success"), {
            description: t("welcomeBack", { name: data.user?.fullName || data.user?.email }),
          });

          router.push(returnUrl);
        },
        onError: (error: any) => {
          toast.error(t("error"), {
            description: error?.response?.data?.message || error?.message || t("errorDesc"),
          });
        },
      }
    );
  };

  const isSubmitting = loginMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {loginMutation.isError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(loginMutation.error as any)?.response?.data?.message ||
                    (loginMutation.error as any)?.message ||
                    t("errorDesc")}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">{t("email")}</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder={t("emailPlaceholder")}
                    className="pl-10"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    onBlur={(e) => validateField("email", e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="email"
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password">{t("password")}</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={t("passwordPlaceholder")}
                    className="pl-10 pr-10"
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    onBlur={(e) => validateField("password", e.target.value)}
                    disabled={isSubmitting}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-destructive">{errors.password}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(checked === true)}
                    disabled={isSubmitting}
                  />
                  <Label htmlFor="remember" className="text-sm font-normal cursor-pointer">
                    {t("rememberMe")}
                  </Label>
                </div>
                <Link
                  href="/forgot-password"
                  className="text-sm text-primary hover:underline"
                >
                  {t("forgotPassword")}
                </Link>
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t("signingIn")}
                  </>
                ) : (
                  <>
                    {t("signIn")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>

            <Separator />

            {/* Social Login */}
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">{t("orContinueWith")}</p>
              <div className="grid grid-cols-2 gap-3">
                <Button variant="outline" disabled={isSubmitting}>
                  Google
                </Button>
                <Button variant="outline" disabled={isSubmitting}>
                  Apple
                </Button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="justify-center">
            <p className="text-sm text-muted-foreground">
              {t("noAccount")}{" "}
              <Link
                href={`/${locale}/auth/register${returnUrl !== `/${locale}` ? `?returnUrl=${encodeURIComponent(returnUrl)}` : ""}`}
                className="text-primary hover:underline font-medium"
              >
                {t("signUp")}
              </Link>
            </p>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}
