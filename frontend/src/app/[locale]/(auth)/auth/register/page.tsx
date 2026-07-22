"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

import { useRegister } from "@/hooks/useAuth";
import { useCreateStore } from "@/hooks/useStores";
import { useUploadFile } from "@/hooks/useUpload";

import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Store,
  Phone,
  MapPin,
  Upload,
  AlertCircle,
  Loader2,
  Check,
} from "lucide-react";

type Step = "personal" | "store" | "confirm";

const personalSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().min(1, "Email is required").email("Invalid email format"),
  phone: z.string().min(8, "Phone number is too short").optional().or(z.literal("")),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const storeSchema = z.object({
  storeName: z.string().min(2, "Store name must be at least 2 characters").optional().or(z.literal("")),
  storeDescription: z.string().optional().or(z.literal("")),
  storeAddress: z.string().optional().or(z.literal("")),
  storePhone: z.string().optional().or(z.literal("")),
});

interface FormData {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  createStore: boolean;
  storeName: string;
  storeDescription: string;
  storeAddress: string;
  storePhone: string;
  avatar: File | null;
  storeLogo: File | null;
  agreeTerms: boolean;
}

export default function RegisterPage() {
  const t = useTranslations("auth.register");
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get("returnUrl") || "/";

  const [step, setStep] = useState<Step>("personal");
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    createStore: false,
    storeName: "",
    storeDescription: "",
    storeAddress: "",
    storePhone: "",
    avatar: null,
    storeLogo: null,
    agreeTerms: false,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const registerMutation = useRegister();
  const createStoreMutation = useCreateStore();
  const uploadMutation = useUploadFile();

  const stepProgress = { personal: 33, store: 66, confirm: 100 };
  const stepIndex = ["personal", "store", "confirm"];
  const currentStepIndex = stepIndex.indexOf(step);

  const validatePersonalStep = useCallback(() => {
    const result = personalSchema.safeParse({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      password: formData.password,
      confirmPassword: formData.confirmPassword,
    });
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        fieldErrors[err.path[0]] = err.message;
      });
      setErrors(fieldErrors);
      return false;
    }
    setErrors({});
    return true;
  }, [formData]);

  const validateStoreStep = useCallback(() => {
    if (!formData.createStore) {
      setErrors({});
      return true;
    }
    if (!formData.storeName || formData.storeName.length < 2) {
      setErrors({ storeName: "Store name must be at least 2 characters" });
      return false;
    }
    setErrors({});
    return true;
  }, [formData]);

  const handleNext = () => {
    if (step === "personal" && validatePersonalStep()) {
      setStep(formData.createStore ? "store" : "confirm");
    } else if (step === "store" && validateStoreStep()) {
      setStep("confirm");
    }
  };

  const handleBack = () => {
    if (step === "store") setStep("personal");
    else if (step === "confirm") setStep(formData.createStore ? "store" : "personal");
  };

  const handleChange = useCallback(
    (field: keyof FormData, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (errors[field]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[field];
          return next;
        });
      }
    },
    [errors]
  );

  const handleFileChange = async (
    field: "avatar" | "storeLogo",
    file: File | null,
    setPreview: (url: string | null) => void
  ) => {
    if (file) {
      setFormData((prev) => ({ ...prev, [field]: file }));
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(file);
    } else {
      setFormData((prev) => ({ ...prev, [field]: null }));
      setPreview(null);
    }
  };

  const handleSubmit = async () => {
    if (!formData.agreeTerms) {
      setErrors({ agreeTerms: "You must agree to the terms" });
      return;
    }

    let avatarUrl = "";
    let storeLogoUrl = "";

    try {
      if (formData.avatar) {
        const uploadRes = await uploadMutation.mutateAsync({
          file: formData.avatar,
          folder: "avatars",
        });
        avatarUrl = uploadRes.url;
      }

      if (formData.createStore && formData.storeLogo) {
        const uploadRes = await uploadMutation.mutateAsync({
          file: formData.storeLogo,
          folder: "store-logos",
        });
        storeLogoUrl = uploadRes.url;
      }

      const nameParts = formData.name.trim().split(/\s+/);
      const firstName = nameParts[0] || formData.name;
      const lastName = nameParts.slice(1).join(" ") || "مستخدم";

      registerMutation.mutate(
        {
          firstName,
          lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          password: formData.password,
        },
        {
          onSuccess: (userData) => {
            if (formData.createStore && userData.user?.id) {
              createStoreMutation.mutate(
                {
                  name: formData.storeName,
                  description: formData.storeDescription || undefined,
                  address: formData.storeAddress || undefined,
                  phone: formData.storePhone || undefined,
                  logo: storeLogoUrl || undefined,
                  ownerId: userData.user.id,
                },
                {
                  onSuccess: () => {
                    toast.success(t("storeCreated"));
                    router.push(`/auth/login?registered=true&returnUrl=${encodeURIComponent(returnUrl)}`);
                  },
                  onError: () => {
                    toast.warning(t("accountCreatedNoStore"));
                    router.push(`/auth/login?registered=true&returnUrl=${encodeURIComponent(returnUrl)}`);
                  },
                }
              );
            } else {
              toast.success(t("success"));
              router.push(`/auth/login?registered=true&returnUrl=${encodeURIComponent(returnUrl)}`);
            }
          },
          onError: (error: any) => {
            toast.error(t("error"), {
              description: error?.response?.data?.message || error?.message || t("errorDesc"),
            });
          },
        }
      );
    } catch (error: any) {
      toast.error(t("uploadError"), {
        description: error?.message || t("uploadErrorDesc"),
      });
    }
  };

  const isSubmitting = registerMutation.isPending || createStoreMutation.isPending || uploadMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/40 px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-lg"
      >
        <Card className="shadow-lg">
          <CardHeader className="space-y-1 text-center">
            <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">{t("title")}</CardTitle>
            <CardDescription>{t("description")}</CardDescription>

            {/* Progress */}
            <div className="pt-4">
              <Progress value={stepProgress[step]} className="h-2" />
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span className={step === "personal" ? "text-primary font-medium" : ""}>{t("steps.personal")}</span>
                <span className={step === "store" ? "text-primary font-medium" : ""}>{t("steps.store")}</span>
                <span className={step === "confirm" ? "text-primary font-medium" : ""}>{t("steps.confirm")}</span>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {registerMutation.isError && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  {(registerMutation.error as any)?.response?.data?.message ||
                    (registerMutation.error as any)?.message ||
                    t("errorDesc")}
                </AlertDescription>
              </Alert>
            )}

            <AnimatePresence mode="wait">
              {/* Step 1: Personal Info */}
              {step === "personal" && (
                <motion.div
                  key="personal"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  {/* Avatar Upload */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      onClick={() => avatarInputRef.current?.click()}
                      className="h-24 w-24 rounded-full bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
                    >
                      {avatarPreview ? (
                        <img src={avatarPreview} alt="Avatar" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange("avatar", e.target.files?.[0] || null, setAvatarPreview)
                      }
                    />
                    <p className="text-xs text-muted-foreground">{t("avatarUpload")}</p>
                  </div>

                  {/* Name */}
                  <div className="space-y-2">
                    <Label htmlFor="name">{t("name")} *</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        placeholder={t("namePlaceholder")}
                        className="pl-10"
                        value={formData.name}
                        onChange={(e) => handleChange("name", e.target.value)}
                      />
                    </div>
                    {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">{t("email")} *</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        placeholder={t("emailPlaceholder")}
                        className="pl-10"
                        value={formData.email}
                        onChange={(e) => handleChange("email", e.target.value)}
                      />
                    </div>
                    {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">{t("phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        type="tel"
                        placeholder={t("phonePlaceholder")}
                        className="pl-10"
                        value={formData.phone}
                        onChange={(e) => handleChange("phone", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div className="space-y-2">
                    <Label htmlFor="password">{t("password")} *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("passwordPlaceholder")}
                        className="pl-10 pr-10"
                        value={formData.password}
                        onChange={(e) => handleChange("password", e.target.value)}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
                  </div>

                  {/* Confirm Password */}
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">{t("confirmPassword")} *</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder={t("confirmPasswordPlaceholder")}
                        className="pl-10"
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange("confirmPassword", e.target.value)}
                      />
                    </div>
                    {errors.confirmPassword && (
                      <p className="text-sm text-destructive">{errors.confirmPassword}</p>
                    )}
                  </div>

                  {/* Create Store Toggle */}
                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="createStore"
                      checked={formData.createStore}
                      onCheckedChange={(checked) => handleChange("createStore", checked === true)}
                    />
                    <Label htmlFor="createStore" className="text-sm font-normal cursor-pointer">
                      {t("createStore")}
                    </Label>
                  </div>

                  <Button className="w-full" onClick={handleNext}>
                    {t("next")}
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              )}

              {/* Step 2: Store Info */}
              {step === "store" && (
                <motion.div
                  key="store"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 text-muted-foreground mb-2">
                    <Store className="h-4 w-4" />
                    <span className="text-sm">{t("storeInfo.subtitle")}</span>
                  </div>

                  {/* Store Logo Upload */}
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      onClick={() => logoInputRef.current?.click()}
                      className="h-20 w-20 rounded-lg bg-muted flex items-center justify-center cursor-pointer overflow-hidden border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 transition-colors"
                    >
                      {logoPreview ? (
                        <img src={logoPreview} alt="Logo" className="h-full w-full object-cover" />
                      ) : (
                        <Upload className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={logoInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) =>
                        handleFileChange("storeLogo", e.target.files?.[0] || null, setLogoPreview)
                      }
                    />
                    <p className="text-xs text-muted-foreground">{t("storeInfo.logoUpload")}</p>
                  </div>

                  {/* Store Name */}
                  <div className="space-y-2">
                    <Label htmlFor="storeName">{t("storeInfo.name")} *</Label>
                    <div className="relative">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="storeName"
                        placeholder={t("storeInfo.namePlaceholder")}
                        className="pl-10"
                        value={formData.storeName}
                        onChange={(e) => handleChange("storeName", e.target.value)}
                      />
                    </div>
                    {errors.storeName && <p className="text-sm text-destructive">{errors.storeName}</p>}
                  </div>

                  {/* Store Description */}
                  <div className="space-y-2">
                    <Label htmlFor="storeDescription">{t("storeInfo.description")}</Label>
                    <Textarea
                      id="storeDescription"
                      placeholder={t("storeInfo.descriptionPlaceholder")}
                      value={formData.storeDescription}
                      onChange={(e) => handleChange("storeDescription", e.target.value)}
                      rows={3}
                    />
                  </div>

                  {/* Store Address */}
                  <div className="space-y-2">
                    <Label htmlFor="storeAddress">{t("storeInfo.address")}</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="storeAddress"
                        placeholder={t("storeInfo.addressPlaceholder")}
                        className="pl-10"
                        value={formData.storeAddress}
                        onChange={(e) => handleChange("storeAddress", e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Store Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="storePhone">{t("storeInfo.phone")}</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="storePhone"
                        type="tel"
                        placeholder={t("storeInfo.phonePlaceholder")}
                        className="pl-10"
                        value={formData.storePhone}
                        onChange={(e) => handleChange("storePhone", e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleBack}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("back")}
                    </Button>
                    <Button className="flex-1" onClick={handleNext}>
                      {t("next")}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Step 3: Confirm */}
              {step === "confirm" && (
                <motion.div
                  key="confirm"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-4"
                >
                  <div className="bg-muted rounded-lg p-4 space-y-3">
                    <h4 className="font-medium">{t("confirm.personalInfo")}</h4>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <span className="text-muted-foreground">{t("confirm.name")}</span>
                      <span>{formData.name}</span>
                      <span className="text-muted-foreground">{t("confirm.email")}</span>
                      <span>{formData.email}</span>
                      {formData.phone && (
                        <>
                          <span className="text-muted-foreground">{t("confirm.phone")}</span>
                          <span>{formData.phone}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {formData.createStore && (
                    <div className="bg-muted rounded-lg p-4 space-y-3">
                      <h4 className="font-medium">{t("confirm.storeInfo")}</h4>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <span className="text-muted-foreground">{t("confirm.storeName")}</span>
                        <span>{formData.storeName}</span>
                        {formData.storeDescription && (
                          <>
                            <span className="text-muted-foreground">{t("confirm.storeDescription")}</span>
                            <span className="truncate">{formData.storeDescription}</span>
                          </>
                        )}
                        {formData.storeAddress && (
                          <>
                            <span className="text-muted-foreground">{t("confirm.storeAddress")}</span>
                            <span>{formData.storeAddress}</span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex items-start space-x-2">
                    <Checkbox
                      id="agreeTerms"
                      checked={formData.agreeTerms}
                      onCheckedChange={(checked) => handleChange("agreeTerms", checked === true)}
                    />
                    <Label htmlFor="agreeTerms" className="text-sm font-normal cursor-pointer leading-tight">
                      {t("agreeTerms")}{" "}
                      <Link href="/terms" className="text-primary hover:underline">
                        {t("terms")}
                      </Link>{" "}
                      {t("and")}{" "}
                      <Link href="/privacy" className="text-primary hover:underline">
                        {t("privacy")}
                      </Link>
                    </Label>
                  </div>
                  {errors.agreeTerms && <p className="text-sm text-destructive">{errors.agreeTerms}</p>}

                  <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={handleBack} disabled={isSubmitting}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("back")}
                    </Button>
                    <Button className="flex-1" onClick={handleSubmit} disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("creating")}
                        </>
                      ) : (
                        <>
                          <Check className="mr-2 h-4 w-4" />
                          {t("createAccount")}
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <Separator className="my-4" />

            <div className="text-center">
              <p className="text-sm text-muted-foreground">
                {t("haveAccount")}{" "}
                <Link href={`/auth/login?returnUrl=${encodeURIComponent(returnUrl)}`} className="text-primary hover:underline font-medium">
                  {t("signIn")}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
