import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ImageOff, Plus, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { AdminProductWriteIn } from "../../api/adminCatalog";
import { fetchCategories } from "../../api/catalog";
import CustomSelect from "../../components/common/CustomSelect";
import Panel from "../../components/common/Panel";
import FormButton from "../../components/forms/FormButton";
import FormInput from "../../components/forms/FormInput";
import {
  useAdminProduct,
  useCreateAdminProduct,
  useUpdateAdminProduct,
} from "../../hooks/admin/useAdminCatalog";
import { useDebouncedValue } from "../../hooks/common/useDebouncedValue";
import {
  adminProductSchema,
  emptyAdminProductDefaults,
  type AdminProductFormData,
} from "../../schemas/adminProductSchema";

const fieldClass =
  "w-full rounded-lg border border-border-base bg-bg-surface px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-border-focus focus:ring-1 focus:ring-border-focus";
const fieldErrorClass =
  "w-full rounded-lg border border-red-500 bg-bg-surface px-3 py-2 text-sm text-text-main outline-none transition-colors focus:border-red-500 focus:ring-1 focus:ring-red-500";

const formWellClass = "p-4 bg-bg-base border border-border-base/40 rounded-xl";

export default function AdminProductFormPage() {
  const { productId } = useParams<{ productId: string }>();
  const isEdit = Boolean(productId);
  const navigate = useNavigate();

  const { data: product, isLoading, isError } = useAdminProduct(productId);
  const { data: categories = [] } = useQuery({
    queryKey: ["categories"],
    queryFn: fetchCategories,
  });

  const createMutation = useCreateAdminProduct();
  const updateMutation = useUpdateAdminProduct(productId ?? "");
  const isSaving = createMutation.isPending || updateMutation.isPending;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isDirty },
  } = useForm<AdminProductFormData>({
    resolver: zodResolver(adminProductSchema),
    defaultValues: emptyAdminProductDefaults,
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "volume_discounts",
  });

  const imageUrl = useWatch({ control, name: "main_image_url" })?.trim() || "";
  const previewUrl = useDebouncedValue(imageUrl, 300);
  const [brokenUrl, setBrokenUrl] = useState<string | null>(null);
  const imageBroken = brokenUrl === previewUrl;

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "Select category…" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  useEffect(() => {
    if (!isEdit || !product) return;
    reset({
      name: product.name,
      sku: product.sku,
      category_id: product.category.id,
      description: product.description ?? "",
      base_price: Number(product.base_price).toFixed(2),
      stock_quantity: String(product.stock_quantity),
      main_image_url: product.main_image_url ?? "",
      is_active: product.is_active,
      is_b2b_only: product.is_b2b_only,
      volume_discounts: (product.volume_discounts ?? []).map((tier) => ({
        min_quantity: String(tier.min_quantity),
        discount_percentage: Number(tier.discount_percentage).toFixed(2),
      })),
    });
  }, [isEdit, product, reset]);

  const onSubmit = (data: AdminProductFormData) => {
    const payload: AdminProductWriteIn = {
      name: data.name.trim(),
      sku: data.sku.trim(),
      category_id: data.category_id,
      description: data.description?.trim() ? data.description.trim() : null,
      base_price: data.base_price.trim(),
      stock_quantity: Number(data.stock_quantity),
      main_image_url: data.main_image_url?.trim()
        ? data.main_image_url.trim()
        : null,
      is_active: data.is_active,
      is_b2b_only: data.is_b2b_only,
      volume_discounts: data.volume_discounts.map((tier) => ({
        min_quantity: Number(tier.min_quantity),
        discount_percentage: Number(tier.discount_percentage).toFixed(2),
      })),
    };

    if (isEdit && productId) {
      updateMutation.mutate(payload, {
        onSuccess: () => {
          toast.success("Product saved.");
          reset(data);
        },
        onError: (error) =>
          toast.error(error.message || "Failed to save product."),
      });
      return;
    }

    createMutation.mutate(payload, {
      onSuccess: (created) => {
        toast.success("Product created.");
        navigate(`/admin/catalog/${created.id}`, { replace: true });
      },
      onError: (error) =>
        toast.error(error.message || "Failed to create product."),
    });
  };

  if (isEdit && isLoading) {
    return <p className="text-sm text-text-muted">Loading product…</p>;
  }

  if (isEdit && (isError || !product)) {
    return (
      <div className="space-y-4">
        <BackLink />
        <p className="text-sm text-red-500">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      <BackLink />

      <div>
        <h2 className="text-3xl font-bold text-text-main mb-2 tracking-tight">
          {isEdit ? "Edit product" : "Add product"}
        </h2>
        <p className="text-text-muted">
          {isEdit
            ? "Update catalog details for this product."
            : "Create a new product for the store catalog."}
        </p>
      </div>

      <form
        onSubmit={handleSubmit(onSubmit)}
        className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start"
      >
        {/* Left — basic details */}
        <Panel title="Basic details">
          <div className={formWellClass}>
            <FormInput
              {...register("name")}
              id="name"
              label="Name"
              placeholder="Product name"
              hideLabel={false}
              error={errors.name?.message}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <FormInput
                {...register("sku")}
                id="sku"
                label="SKU"
                placeholder="SKU"
                hideLabel={false}
                error={errors.sku?.message}
              />
              <div className="flex w-full flex-col">
                <span className="mb-1 block text-sm font-medium text-text-main">
                  Category
                </span>
                <Controller
                  name="category_id"
                  control={control}
                  render={({ field }) => (
                    <CustomSelect
                      value={field.value}
                      onChange={field.onChange}
                      options={categoryOptions}
                      aria-label="Category"
                      className="w-full min-w-0"
                      triggerClassName={
                        errors.category_id
                          ? "bg-bg-surface border-red-500 hover:border-red-500"
                          : "bg-bg-surface border-border-base hover:border-border-base/70"
                      }
                    />
                  )}
                />
                <div className="mt-1 h-4">
                  {errors.category_id?.message ? (
                    <span className="block text-right text-[11px] font-semibold leading-tight text-red-500">
                      {errors.category_id.message}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_7rem] gap-3 items-start">
              <div className="flex flex-col">
                <label
                  htmlFor="main_image_url"
                  className="mb-1 block text-sm font-medium text-text-main"
                >
                  Image URL
                </label>
                <textarea
                  id="main_image_url"
                  {...register("main_image_url")}
                  placeholder="https://… or /products/…"
                  className={`${
                    errors.main_image_url ? fieldErrorClass : fieldClass
                  } h-20 resize-none overflow-y-auto`}
                />
                <div className="mt-1 h-4">
                  {errors.main_image_url?.message ? (
                    <span className="block text-right text-[11px] font-semibold leading-tight text-red-500">
                      {errors.main_image_url.message}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="flex flex-col">
                <p className="mb-1 text-sm font-medium text-text-main">
                  Preview
                </p>
                {previewUrl && !imageBroken ? (
                  <img
                    src={previewUrl}
                    alt="Product preview"
                    onError={() => setBrokenUrl(previewUrl)}
                    className="h-28 w-28 rounded-lg border border-border-base bg-bg-surface object-contain p-2"
                  />
                ) : (
                  <div className="flex h-28 w-28 flex-col items-center justify-center gap-1 rounded-lg border border-border-base bg-bg-surface">
                    <ImageOff
                      size={20}
                      strokeWidth={1.5}
                      className={
                        imageBroken ? "text-red-500" : "text-text-muted"
                      }
                    />
                    <span
                      className={`text-[10px] font-medium text-center px-1 ${
                        imageBroken ? "text-red-500" : "text-text-muted"
                      }`}
                    >
                      {imageBroken ? "Could not load" : "No image"}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex w-full flex-col ">
              <label
                htmlFor="description"
                className="mb-1 block text-sm font-medium text-text-main"
              >
                Description
              </label>
              <textarea
                id="description"
                {...register("description")}
                placeholder="Optional product description"
                className={`${
                  errors.description ? fieldErrorClass : fieldClass
                } h-32 resize-none overflow-y-auto`}
              />
              <div className="mt-1 h-4">
                {errors.description?.message ? (
                  <span className="block text-right text-[11px] font-semibold leading-tight text-red-500">
                    {errors.description.message}
                  </span>
                ) : null}
              </div>
            </div>

            {isEdit && product && (
              <div>
                <p className="mb-1 text-sm font-medium text-text-main">
                  URL slug
                </p>
                <p className="rounded-lg border border-border-base bg-bg-surface px-3 py-2 font-mono text-sm text-text-muted">
                  {product.slug}
                </p>
                <p className="mt-1 text-xs text-text-muted">
                  Generated automatically from the product name.
                </p>
              </div>
            )}
          </div>
        </Panel>

        {/* Right — pricing, volume discounts, visibility, actions */}
        <div className="space-y-6">
          <Panel title="Pricing & stock">
            <div className={formWellClass}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  {...register("base_price")}
                  id="base_price"
                  label="Base price"
                  placeholder="0.00"
                  hideLabel={false}
                  error={errors.base_price?.message}
                />
                <FormInput
                  {...register("stock_quantity")}
                  id="stock_quantity"
                  label="Stock quantity"
                  placeholder="0"
                  hideLabel={false}
                  error={errors.stock_quantity?.message}
                />
              </div>

              <div className="border-t border-border-base/30 pt-4 mt-2">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-text-main">
                    Volume discounts
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      append({ min_quantity: "", discount_percentage: "" })
                    }
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-base/40 bg-bg-surface px-3 py-1.5 text-xs font-semibold text-text-main hover:border-primary hover:text-primary transition-colors"
                  >
                    <Plus size={14} strokeWidth={2.5} />
                    Add tier
                  </button>
                </div>

                {fields.length === 0 ? (
                  <p className="py-2 text-center text-xs text-text-muted">
                    No volume discounts yet.
                  </p>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[1fr_1fr_2.25rem] gap-3 px-0.5">
                      <span className="text-xs font-medium text-text-muted">
                        Min. qty
                      </span>
                      <span className="text-xs font-medium text-text-muted">
                        Discount %
                      </span>
                      <span />
                    </div>

                    {fields.map((field, index) => (
                      <div
                        key={field.id}
                        className="grid grid-cols-[1fr_1fr_2.25rem] items-start gap-3"
                      >
                        <div>
                          <input
                            {...register(
                              `volume_discounts.${index}.min_quantity`,
                            )}
                            placeholder="10"
                            className={
                              errors.volume_discounts?.[index]?.min_quantity
                                ? fieldErrorClass
                                : fieldClass
                            }
                          />
                          <div className="mt-0.5 h-3.5">
                            {errors.volume_discounts?.[index]?.min_quantity
                              ?.message ? (
                              <span className="text-[10px] font-semibold text-red-500">
                                {
                                  errors.volume_discounts[index]?.min_quantity
                                    ?.message
                                }
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <div>
                          <input
                            {...register(
                              `volume_discounts.${index}.discount_percentage`,
                            )}
                            placeholder="5"
                            className={
                              errors.volume_discounts?.[index]
                                ?.discount_percentage
                                ? fieldErrorClass
                                : fieldClass
                            }
                          />
                          <div className="mt-0.5 h-3.5">
                            {errors.volume_discounts?.[index]
                              ?.discount_percentage?.message ? (
                              <span className="text-[10px] font-semibold text-red-500">
                                {
                                  errors.volume_discounts[index]
                                    ?.discount_percentage?.message
                                }
                              </span>
                            ) : null}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => remove(index)}
                          className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-md text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors"
                          aria-label={`Remove tier ${index + 1}`}
                          title="Remove tier"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </Panel>

          <Panel title="Visibility">
            <div className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_active")}
                  className="size-4 rounded border-border-base/50 text-primary accent-primary"
                />
                Active (visible in store)
              </label>
              <label className="flex items-center gap-2 text-sm text-text-main cursor-pointer select-none">
                <input
                  type="checkbox"
                  {...register("is_b2b_only")}
                  className="size-4 rounded border-border-base/50 text-primary accent-primary"
                />
                B2B only (blocked in private purchase mode)
              </label>
            </div>
          </Panel>

          <div className="flex flex-row items-center justify-end gap-3">
            <Link
              to="/admin/catalog"
              className="inline-flex h-10 items-center justify-center rounded-lg border border-border-base/40 px-5 text-sm font-semibold text-text-main hover:bg-bg-base transition-colors"
            >
              Cancel
            </Link>
            <FormButton
              type="submit"
              disabled={isSaving || (isEdit && !isDirty)}
              className="h-10 w-auto px-5 py-0 text-sm"
            >
              {isSaving
                ? "Saving…"
                : isEdit
                  ? "Save changes"
                  : "Create product"}
            </FormButton>
          </div>
        </div>
      </form>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      to="/admin/catalog"
      className="inline-flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
    >
      <ArrowLeft size={16} />
      Back to catalog
    </Link>
  );
}
