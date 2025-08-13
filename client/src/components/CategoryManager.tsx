import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateCategoryInput, UpdateCategoryInput, Category, Language } from '../../../server/src/schema';

interface CategoryManagerProps {
  language: Language;
  categories: Category[];
  onCategoriesChange: (categories: Category[]) => void;
}

export function CategoryManager({ language, categories, onCategoriesChange }: CategoryManagerProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [createFormData, setCreateFormData] = useState<CreateCategoryInput>({
    name_id: '',
    name_en: '',
    description_id: null,
    description_en: null
  });

  const [editFormData, setEditFormData] = useState<UpdateCategoryInput>({
    id: 0,
    name_id: '',
    name_en: '',
    description_id: null,
    description_en: null
  });

  const labels = language === 'id' ? {
    categoryManagement: 'Manajemen Kategori',
    categoryDescription: 'Kelola kategori untuk mengelompokkan dokumen hukum',
    createCategory: 'Buat Kategori Baru',
    editCategory: 'Edit Kategori',
    nameId: 'Nama (Indonesia)',
    nameEn: 'Nama (English)',
    descriptionId: 'Deskripsi (Indonesia)',
    descriptionEn: 'Deskripsi (English)',
    optional: 'Opsional',
    required: 'Wajib diisi',
    create: 'Buat',
    update: 'Update',
    cancel: 'Batal',
    edit: 'Edit',
    delete: 'Hapus',
    deleteConfirmTitle: 'Hapus Kategori',
    deleteConfirmDescription: 'Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan.',
    creating: 'Membuat...',
    updating: 'Mengupdate...',
    noCategories: 'Belum ada kategori',
    noDescription: 'Tidak ada deskripsi',
    createdOn: 'Dibuat pada',
    success: 'Berhasil!',
    errorCreate: 'Gagal membuat kategori',
    errorUpdate: 'Gagal mengupdate kategori',
    errorDelete: 'Gagal menghapus kategori'
  } : {
    categoryManagement: 'Category Management',
    categoryDescription: 'Manage categories to organize legal documents',
    createCategory: 'Create New Category',
    editCategory: 'Edit Category',
    nameId: 'Name (Indonesian)',
    nameEn: 'Name (English)',
    descriptionId: 'Description (Indonesian)',
    descriptionEn: 'Description (English)',
    optional: 'Optional',
    required: 'Required',
    create: 'Create',
    update: 'Update',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    deleteConfirmTitle: 'Delete Category',
    deleteConfirmDescription: 'Are you sure you want to delete this category? This action cannot be undone.',
    creating: 'Creating...',
    updating: 'Updating...',
    noCategories: 'No categories yet',
    noDescription: 'No description',
    createdOn: 'Created on',
    success: 'Success!',
    errorCreate: 'Failed to create category',
    errorUpdate: 'Failed to update category',
    errorDelete: 'Failed to delete category'
  };

  const resetCreateForm = () => {
    setCreateFormData({
      name_id: '',
      name_en: '',
      description_id: null,
      description_en: null
    });
    setShowCreateForm(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const newCategory = await trpc.createCategory.mutate(createFormData);
      onCategoriesChange([...categories, newCategory]);
      resetCreateForm();
      alert(labels.success);
    } catch (error) {
      console.error('Failed to create category:', error);
      alert(labels.errorCreate);
    } finally {
      setIsLoading(false);
    }
  };

  const startEdit = (category: Category) => {
    setEditFormData({
      id: category.id,
      name_id: category.name_id,
      name_en: category.name_en,
      description_id: category.description_id,
      description_en: category.description_en
    });
    setEditingCategory(category);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const updatedCategory = await trpc.updateCategory.mutate(editFormData);
      onCategoriesChange(categories.map(cat => cat.id === updatedCategory.id ? updatedCategory : cat));
      setEditingCategory(null);
      alert(labels.success);
    } catch (error) {
      console.error('Failed to update category:', error);
      alert(labels.errorUpdate);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (categoryId: number) => {
    setIsLoading(true);
    try {
      await trpc.deleteCategory.mutate({ id: categoryId });
      onCategoriesChange(categories.filter(cat => cat.id !== categoryId));
      alert(labels.success);
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert(labels.errorDelete);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📂 {labels.categoryManagement}
          </CardTitle>
          <CardDescription>
            {labels.categoryDescription}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-semibold">
              {categories.length > 0 ? `${categories.length} kategori` : labels.noCategories}
            </h3>
            <Button onClick={() => setShowCreateForm(true)} disabled={showCreateForm}>
              ➕ {labels.createCategory}
            </Button>
          </div>

          {/* Create Form */}
          {showCreateForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle className="text-lg">➕ {labels.createCategory}</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create_name_id">{labels.nameId} <span className="text-red-500">*</span></Label>
                      <Input
                        id="create_name_id"
                        value={createFormData.name_id}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, name_id: e.target.value }))}
                        placeholder={labels.nameId}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create_name_en">{labels.nameEn} <span className="text-red-500">*</span></Label>
                      <Input
                        id="create_name_en"
                        value={createFormData.name_en}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, name_en: e.target.value }))}
                        placeholder={labels.nameEn}
                        required
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="create_desc_id">{labels.descriptionId} <span className="text-gray-400">({labels.optional})</span></Label>
                      <Textarea
                        id="create_desc_id"
                        value={createFormData.description_id || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, description_id: e.target.value || null }))}
                        placeholder={labels.descriptionId}
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="create_desc_en">{labels.descriptionEn} <span className="text-gray-400">({labels.optional})</span></Label>
                      <Textarea
                        id="create_desc_en"
                        value={createFormData.description_en || ''}
                        onChange={(e) => setCreateFormData(prev => ({ ...prev, description_en: e.target.value || null }))}
                        placeholder={labels.descriptionEn}
                        rows={3}
                      />
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? labels.creating : labels.create}
                    </Button>
                    <Button type="button" variant="outline" onClick={resetCreateForm}>
                      {labels.cancel}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Categories List */}
          <div className="space-y-4">
            {categories.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-6xl mb-4">📂</div>
                <p>{labels.noCategories}</p>
              </div>
            ) : (
              categories.map((category) => (
                <Card key={category.id}>
                  <CardContent className="pt-6">
                    {editingCategory?.id === category.id ? (
                      <form onSubmit={handleUpdate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit_name_id">{labels.nameId} <span className="text-red-500">*</span></Label>
                            <Input
                              id="edit_name_id"
                              value={editFormData.name_id}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name_id: e.target.value }))}
                              placeholder={labels.nameId}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit_name_en">{labels.nameEn} <span className="text-red-500">*</span></Label>
                            <Input
                              id="edit_name_en"
                              value={editFormData.name_en}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, name_en: e.target.value }))}
                              placeholder={labels.nameEn}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="edit_desc_id">{labels.descriptionId} <span className="text-gray-400">({labels.optional})</span></Label>
                            <Textarea
                              id="edit_desc_id"
                              value={editFormData.description_id || ''}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, description_id: e.target.value || null }))}
                              placeholder={labels.descriptionId}
                              rows={3}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="edit_desc_en">{labels.descriptionEn} <span className="text-gray-400">({labels.optional})</span></Label>
                            <Textarea
                              id="edit_desc_en"
                              value={editFormData.description_en || ''}
                              onChange={(e) => setEditFormData(prev => ({ ...prev, description_en: e.target.value || null }))}
                              placeholder={labels.descriptionEn}
                              rows={3}
                            />
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button type="submit" disabled={isLoading}>
                            {isLoading ? labels.updating : labels.update}
                          </Button>
                          <Button type="button" variant="outline" onClick={() => setEditingCategory(null)}>
                            {labels.cancel}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="text-lg font-semibold mb-2">
                              {language === 'id' ? category.name_id : category.name_en}
                            </h3>
                            <div className="flex gap-2 mb-2">
                              <Badge variant="outline">🇮🇩 {category.name_id}</Badge>
                              <Badge variant="outline">🇬🇧 {category.name_en}</Badge>
                            </div>
                            {(category.description_id || category.description_en) && (
                              <p className="text-gray-600 mb-3">
                                {language === 'id' 
                                  ? (category.description_id || labels.noDescription)
                                  : (category.description_en || labels.noDescription)
                                }
                              </p>
                            )}
                            <p className="text-sm text-gray-400">
                              {labels.createdOn}: {category.created_at.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US')}
                            </p>
                          </div>
                          <div className="flex gap-2 ml-4">
                            <Button variant="outline" size="sm" onClick={() => startEdit(category)}>
                              ✏️ {labels.edit}
                            </Button>
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="destructive" size="sm">
                                  🗑️ {labels.delete}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>{labels.deleteConfirmTitle}</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    {labels.deleteConfirmDescription}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>{labels.cancel}</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleDelete(category.id)}
                                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                  >
                                    {labels.delete}
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}