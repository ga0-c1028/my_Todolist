import { useState, type JSX } from 'react';
import { AppHeader } from '../../../widgets/app-header';
import { useCategoriesQuery, type Category } from '../../../entities/category';
import { CategoryForm, useCreateCategory, useUpdateCategory, useDeleteCategory } from '../../../features/category-manage';
import { Button, ConfirmDialog } from '../../../shared/ui';
import { useLocale } from '../../../shared/config';
import './CategoryManagePage.css';

export function CategoryManagePage(): JSX.Element {
  const { data: categories } = useCategoriesQuery();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();
  const deleteMutation = useDeleteCategory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Category | null>(null);
  const { t } = useLocale();

  function handleCreate(name: string): void {
    createMutation.mutate({ name });
  }

  function handleUpdate(category: Category, name: string): void {
    updateMutation.mutate(
      { id: category.id, payload: { name } },
      { onSuccess: () => setEditingId(null) },
    );
  }

  function handleConfirmDelete(): void {
    if (!pendingDelete) return;
    deleteMutation.mutate(pendingDelete.id);
    setPendingDelete(null);
  }

  const sorted = [...(categories ?? [])].sort((a, b) =>
    a.isDefault === b.isDefault ? 0 : a.isDefault ? -1 : 1,
  );

  return (
    <div className="category-manage-page">
      <AppHeader />
      <div className="category-manage-page__content">
        <h1>{t('category.pageTitle')}</h1>

        <CategoryForm
          onSubmit={handleCreate}
          submitLabel={t('category.addSubmitLabel')}
          isSubmitting={createMutation.isPending}
          serverError={createMutation.error?.message}
        />

        <div className="category-manage-page__list">
          {sorted.map((category) =>
            category.isDefault ? (
              <div key={category.id} className="category-manage-page__row">
                <span className="category-manage-page__name">{category.name}</span>
                <span className="category-manage-page__badge">{t('category.notEditable')}</span>
                <span className="category-manage-page__badge">{t('category.notDeletable')}</span>
              </div>
            ) : editingId === category.id ? (
              <div key={category.id} className="category-manage-page__row">
                <CategoryForm
                  initialName={category.name}
                  onSubmit={(name) => handleUpdate(category, name)}
                  onCancel={() => setEditingId(null)}
                  submitLabel={t('category.saveSubmitLabel')}
                  isSubmitting={updateMutation.isPending}
                  serverError={updateMutation.error?.message}
                />
              </div>
            ) : (
              <div key={category.id} className="category-manage-page__row">
                <span className="category-manage-page__name">{category.name}</span>
                <div className="category-manage-page__actions">
                  <Button type="button" variant="secondary" onClick={() => setEditingId(category.id)}>
                    {t('common.edit')}
                  </Button>
                  <Button type="button" variant="secondary" onClick={() => setPendingDelete(category)}>
                    {t('common.delete')}
                  </Button>
                </div>
              </div>
            ),
          )}
        </div>
      </div>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={t('category.deleteConfirmTitle')}
        description={t('category.deleteConfirmDescription')}
        confirmLabel={t('common.delete')}
        cancelLabel={t('common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
