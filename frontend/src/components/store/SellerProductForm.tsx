"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/label";
import { useCategories } from "@/hooks/useCategories";
import { useCreateProduct, useUpdateProduct } from "@/hooks/useProducts";
import type { CreateProductData, Product } from "@/services/products.service";

type Props = {
  mode: "create" | "edit";
  storeId: string;
  product?: Product | null;
};

export function SellerProductForm({ mode, storeId, product }: Props) {
  const t = useTranslations("dashboard.products");
  const router = useRouter();
  const { data: categories = [], isLoading: categoriesLoading } = useCategories();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [price, setPrice] = useState("");
  const [compareAtPrice, setCompareAtPrice] = useState("");
  const [inventoryQuantity, setInventoryQuantity] = useState("10");
  const [sku, setSku] = useState("");
  const [lowStockThreshold, setLowStockThreshold] = useState("5");
  const [status, setStatus] = useState<"draft" | "active">("active");
  const [imageUrl, setImageUrl] = useState("");

  useEffect(() => {
    if (!product) return;
    setName(product.name || "");
    setDescription(product.description || "");
    setShortDescription(product.shortDescription || "");
    setCategoryId(product.categoryId || "");
    setPrice(String(product.price ?? ""));
    setCompareAtPrice(
      product.compareAtPrice != null ? String(product.compareAtPrice) : "",
    );
    setInventoryQuantity(
      String(product.quantity ?? product.stock ?? inventoryQuantity),
    );
    setSku(product.sku || "");
    setLowStockThreshold(String(product.lowStockThreshold ?? 5));
    setStatus(product.status === "draft" ? "draft" : "active");
    const img =
      product.image ||
      (typeof product.images?.[0] === "string"
        ? (product.images[0] as unknown as string)
        : product.images?.[0]?.url) ||
      "";
    setImageUrl(img);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?.id]);

  const saving = createProduct.isPending || updateProduct.isPending;

  const onSubmit = async (asDraft?: boolean) => {
    if (!storeId) {
      toast.error("متجرك غير مرتبط بالحساب");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      toast.error(t("form.namePlaceholder"));
      return;
    }
    if (!categoryId) {
      toast.error(t("form.selectCategory"));
      return;
    }
    const priceNum = Number(price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      toast.error(t("form.price"));
      return;
    }
    const qty = Number(inventoryQuantity);
    if (!Number.isFinite(qty) || qty < 0) {
      toast.error(t("form.quantity"));
      return;
    }

    const payload: CreateProductData = {
      storeId,
      categoryId,
      name: name.trim(),
      type: "physical",
      price: priceNum,
      inventoryQuantity: qty,
      description: description.trim() || undefined,
      shortDescription: shortDescription.trim() || undefined,
      compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
      sku: sku.trim() || undefined,
      lowStockThreshold: Number(lowStockThreshold) || 5,
      status: asDraft ? "draft" : status,
      images: imageUrl.trim() ? [imageUrl.trim()] : undefined,
    };

    try {
      if (mode === "create") {
        const created = await createProduct.mutateAsync(payload);
        toast.success(t("saveSuccess"));
        router.push(
          created?.id
            ? `/dashboard/store/products/${created.id}/edit`
            : "/dashboard/store",
        );
      } else if (product?.id) {
        await updateProduct.mutateAsync({ id: product.id, ...payload });
        toast.success(t("updateSuccess"));
        router.push("/dashboard/store");
      }
    } catch (err: any) {
      const message =
        err?.response?.data?.message || err?.message || "تعذر حفظ المنتج";
      toast.error(Array.isArray(message) ? message[0] : message);
    }
  };

  return (
    <form
      className="space-y-6"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(false);
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">{t("form.name")}</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("form.namePlaceholder")}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="shortDescription">{t("form.shortDescription")}</Label>
          <Input
            id="shortDescription"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{t("form.description")}</Label>
          <textarea
            id="description"
            className="min-h-[120px] w-full rounded-md border bg-background px-3 py-2 text-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={t("form.descriptionPlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">{t("form.category")}</Label>
          <select
            id="category"
            className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            disabled={categoriesLoading}
            required
          >
            <option value="">{t("form.selectCategory")}</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.nameAr || cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">{t("form.sku")}</Label>
          <Input
            id="sku"
            value={sku}
            onChange={(e) => setSku(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="price">{t("form.price")} (OMR)</Label>
          <Input
            id="price"
            type="number"
            min="0.001"
            step="0.001"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="compareAtPrice">{t("form.salePrice")}</Label>
          <Input
            id="compareAtPrice"
            type="number"
            min="0"
            step="0.001"
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="qty">{t("form.quantity")}</Label>
          <Input
            id="qty"
            type="number"
            min="0"
            step="1"
            value={inventoryQuantity}
            onChange={(e) => setInventoryQuantity(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lowStock">{t("form.lowStockAlert")}</Label>
          <Input
            id="lowStock"
            type="number"
            min="0"
            step="1"
            value={lowStockThreshold}
            onChange={(e) => setLowStockThreshold(e.target.value)}
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="image">{t("form.images")} (URL)</Label>
          <Input
            id="image"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://..."
          />
          <p className="text-xs text-muted-foreground">{t("form.imageHint")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving}>
          {saving ? <Loader2 className="me-2 h-4 w-4 animate-spin" /> : null}
          {mode === "create" ? t("form.publish") : t("form.updateProduct")}
        </Button>
        {mode === "create" ? (
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => onSubmit(true)}
          >
            {t("form.saveAsDraft")}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="ghost"
          disabled={saving}
          onClick={() => router.push("/dashboard/store")}
        >
          {t("form.cancel")}
        </Button>
      </div>
    </form>
  );
}
