import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { trpc } from '@/utils/trpc';
import { useState } from 'react';
import type { CreateLegalDocumentInput, Category, Language, DocumentType } from '../../../server/src/schema';

interface DocumentFormProps {
  language: Language;
  categories: Category[];
  onDocumentCreated: () => void;
}

export function DocumentForm({ language, categories, onDocumentCreated }: DocumentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const [formData, setFormData] = useState<CreateLegalDocumentInput>({
    title_id: '',
    title_en: '',
    content_id: '',
    content_en: '',
    summary_id: null,
    summary_en: null,
    document_type: 'article',
    category_id: 0,
    document_number: null,
    publication_date: null,
    effective_date: null,
    tags: [],
    file_url: null,
    is_published: false
  });

  const labels = language === 'id' ? {
    createDocument: 'Buat Dokumen Hukum Baru',
    createDescription: 'Isi formulir untuk membuat dokumen hukum baru dengan dukungan multi-bahasa',
    basicInfo: 'Informasi Dasar',
    content: 'Konten',
    metadata: 'Metadata',
    titleId: 'Judul (Indonesia)',
    titleEn: 'Judul (English)',
    summaryId: 'Ringkasan (Indonesia)',
    summaryEn: 'Ringkasan (English)',
    contentId: 'Isi Dokumen (Indonesia)',
    contentEn: 'Isi Dokumen (English)',
    documentType: 'Jenis Dokumen',
    category: 'Kategori',
    documentNumber: 'Nomor Dokumen',
    publicationDate: 'Tanggal Terbit',
    effectiveDate: 'Tanggal Berlaku',
    fileUrl: 'URL File (PDF/Dokumen)',
    tags: 'Tag',
    addTag: 'Tambah Tag',
    published: 'Terbitkan',
    creating: 'Membuat...',
    create: 'Buat Dokumen',
    required: 'Wajib diisi',
    optional: 'Opsional',
    success: 'Dokumen berhasil dibuat!',
    article: 'Artikel',
    law: 'Undang-Undang',
    decision: 'Putusan',
    selectCategory: 'Pilih Kategori'
  } : {
    createDocument: 'Create New Legal Document',
    createDescription: 'Fill out the form to create a new legal document with multi-language support',
    basicInfo: 'Basic Information',
    content: 'Content',
    metadata: 'Metadata',
    titleId: 'Title (Indonesian)',
    titleEn: 'Title (English)',
    summaryId: 'Summary (Indonesian)',
    summaryEn: 'Summary (English)',
    contentId: 'Content (Indonesian)',
    contentEn: 'Content (English)',
    documentType: 'Document Type',
    category: 'Category',
    documentNumber: 'Document Number',
    publicationDate: 'Publication Date',
    effectiveDate: 'Effective Date',
    fileUrl: 'File URL (PDF/Document)',
    tags: 'Tags',
    addTag: 'Add Tag',
    published: 'Published',
    creating: 'Creating...',
    create: 'Create Document',
    required: 'Required',
    optional: 'Optional',
    success: 'Document created successfully!',
    article: 'Article',
    law: 'Law',
    decision: 'Decision',
    selectCategory: 'Select Category'
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const submitData = {
        ...formData,
        tags,
        summary_id: formData.summary_id || null,
        summary_en: formData.summary_en || null,
        document_number: formData.document_number || null,
        publication_date: formData.publication_date ? new Date(formData.publication_date) : null,
        effective_date: formData.effective_date ? new Date(formData.effective_date) : null,
        file_url: formData.file_url || null
      };

      await trpc.createLegalDocument.mutate(submitData);
      
      // Reset form
      setFormData({
        title_id: '',
        title_en: '',
        content_id: '',
        content_en: '',
        summary_id: null,
        summary_en: null,
        document_type: 'article',
        category_id: 0,
        document_number: null,
        publication_date: null,
        effective_date: null,
        tags: [],
        file_url: null,
        is_published: false
      });
      setTags([]);
      
      onDocumentCreated();
      alert(labels.success);
    } catch (error) {
      console.error('Failed to create document:', error);
      alert('Error creating document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleTagInputKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📝 {labels.createDocument}
        </CardTitle>
        <CardDescription>
          {labels.createDescription}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-8">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basic">{labels.basicInfo}</TabsTrigger>
              <TabsTrigger value="content">{labels.content}</TabsTrigger>
              <TabsTrigger value="metadata">{labels.metadata}</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-6">
              {/* Titles */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title_id">{labels.titleId} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title_id"
                    value={formData.title_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_id: e.target.value }))}
                    placeholder={labels.titleId}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title_en">{labels.titleEn} <span className="text-red-500">*</span></Label>
                  <Input
                    id="title_en"
                    value={formData.title_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, title_en: e.target.value }))}
                    placeholder={labels.titleEn}
                    required
                  />
                </div>
              </div>

              {/* Document Type and Category */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_type">{labels.documentType} <span className="text-red-500">*</span></Label>
                  <Select value={formData.document_type} onValueChange={(value: DocumentType) => setFormData(prev => ({ ...prev, document_type: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="article">{labels.article}</SelectItem>
                      <SelectItem value="law">{labels.law}</SelectItem>
                      <SelectItem value="decision">{labels.decision}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category_id">{labels.category} <span className="text-red-500">*</span></Label>
                  <Select value={formData.category_id.toString()} onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: Number(value) }))}>
                    <SelectTrigger>
                      <SelectValue placeholder={labels.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {language === 'id' ? category.name_id : category.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Summaries */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="summary_id">{labels.summaryId} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Textarea
                    id="summary_id"
                    value={formData.summary_id || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary_id: e.target.value || null }))}
                    placeholder={labels.summaryId}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="summary_en">{labels.summaryEn} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Textarea
                    id="summary_en"
                    value={formData.summary_en || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, summary_en: e.target.value || null }))}
                    placeholder={labels.summaryEn}
                    rows={3}
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content" className="space-y-6">
              {/* Content */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="content_id">{labels.contentId} <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="content_id"
                    value={formData.content_id}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_id: e.target.value }))}
                    placeholder={labels.contentId}
                    rows={12}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="content_en">{labels.contentEn} <span className="text-red-500">*</span></Label>
                  <Textarea
                    id="content_en"
                    value={formData.content_en}
                    onChange={(e) => setFormData(prev => ({ ...prev, content_en: e.target.value }))}
                    placeholder={labels.contentEn}
                    rows={12}
                    required
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="metadata" className="space-y-6">
              {/* Document Number and File URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="document_number">{labels.documentNumber} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Input
                    id="document_number"
                    value={formData.document_number || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, document_number: e.target.value || null }))}
                    placeholder={labels.documentNumber}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="file_url">{labels.fileUrl} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Input
                    id="file_url"
                    type="url"
                    value={formData.file_url || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, file_url: e.target.value || null }))}
                    placeholder={labels.fileUrl}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="publication_date">{labels.publicationDate} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Input
                    id="publication_date"
                    type="date"
                    value={formData.publication_date ? formData.publication_date.toString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, publication_date: e.target.value ? new Date(e.target.value) : null }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="effective_date">{labels.effectiveDate} <span className="text-gray-400">({labels.optional})</span></Label>
                  <Input
                    id="effective_date"
                    type="date"
                    value={formData.effective_date ? formData.effective_date.toString().split('T')[0] : ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, effective_date: e.target.value ? new Date(e.target.value) : null }))}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="space-y-2">
                <Label htmlFor="tags">{labels.tags}</Label>
                <div className="flex gap-2">
                  <Input
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyPress={handleTagInputKeyPress}
                    placeholder={labels.addTag}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline">
                    {labels.addTag}
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="outline" className="flex items-center gap-1">
                        #{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-1 hover:text-red-500"
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Published Switch */}
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_published"
                  checked={formData.is_published}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
                />
                <Label htmlFor="is_published">{labels.published}</Label>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading} className="min-w-32">
              {isLoading ? labels.creating : labels.create}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}