import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { trpc } from '@/utils/trpc';
import { useState, useEffect, useCallback } from 'react';
import type { SearchResults, Category, Language, DocumentType, LocalizedDocument } from '../../server/src/schema';
import { DocumentDetail } from '@/components/DocumentDetail';
import { DocumentForm } from '@/components/DocumentForm';
import { CategoryManager } from '@/components/CategoryManager';

function App() {
  const [searchResults, setSearchResults] = useState<SearchResults>({
    documents: [],
    total_count: 0,
    has_more: false
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedDocument, setSelectedDocument] = useState<LocalizedDocument | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('id');
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('browse');

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<number | 'all'>('all');

  // Load categories on mount
  const loadCategories = useCallback(async () => {
    try {
      const result = await trpc.getCategories.query();
      setCategories(result);
    } catch (error) {
      console.error('Failed to load categories:', error);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Search documents function
  const searchDocuments = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await trpc.searchDocuments.query({
        query: searchQuery || undefined,
        document_type: selectedDocumentType !== 'all' ? selectedDocumentType : undefined,
        category_id: selectedCategory !== 'all' ? Number(selectedCategory) : undefined,
        language: currentLanguage,
        published_only: true,
        limit: 20,
        offset: 0
      });
      setSearchResults(result);
    } catch (error) {
      console.error('Failed to search documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, selectedDocumentType, selectedCategory, currentLanguage]);

  // Load initial documents
  useEffect(() => {
    searchDocuments();
  }, [searchDocuments]);

  // Handle document selection
  const handleDocumentClick = async (documentId: number) => {
    try {
      const document = await trpc.getLegalDocument.query({
        id: documentId,
        language: currentLanguage
      });
      setSelectedDocument(document);
    } catch (error) {
      console.error('Failed to load document:', error);
    }
  };

  // Language labels
  const labels = currentLanguage === 'id' ? {
    title: 'Portal Hukum Indonesia',
    subtitle: 'Jelajahi dokumen hukum, undang-undang, dan putusan pengadilan',
    search: 'Cari dokumen hukum...',
    allTypes: 'Semua Jenis',
    allCategories: 'Semua Kategori',
    article: 'Artikel',
    law: 'Undang-Undang',
    decision: 'Putusan',
    browse: 'Jelajahi',
    manage: 'Kelola',
    categories: 'Kategori',
    documents: 'Dokumen',
    published: 'Terbit',
    created: 'Dibuat',
    noResults: 'Tidak ada dokumen ditemukan',
    noResultsDesc: 'Coba ubah kata kunci pencarian atau filter'
  } : {
    title: 'Indonesian Legal Portal',
    subtitle: 'Explore legal documents, laws, and court decisions',
    search: 'Search legal documents...',
    allTypes: 'All Types',
    allCategories: 'All Categories',
    article: 'Article',
    law: 'Law',
    decision: 'Decision',
    browse: 'Browse',
    manage: 'Manage',
    categories: 'Categories',
    documents: 'Documents',
    published: 'Published',
    created: 'Created',
    noResults: 'No documents found',
    noResultsDesc: 'Try changing your search keywords or filters'
  };

  const getDocumentTypeLabel = (type: DocumentType) => {
    const typeLabels = {
      article: labels.article,
      law: labels.law,
      decision: labels.decision
    };
    return typeLabels[type];
  };

  const getCategoryName = (categoryId: number) => {
    const category = categories.find(c => c.id === categoryId);
    return category ? (currentLanguage === 'id' ? category.name_id : category.name_en) : '';
  };

  if (selectedDocument) {
    return (
      <DocumentDetail 
        document={selectedDocument} 
        language={currentLanguage}
        onBack={() => setSelectedDocument(null)}
        onLanguageChange={setCurrentLanguage}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                ⚖️ {labels.title}
              </h1>
              <p className="text-gray-600 mt-1">{labels.subtitle}</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={currentLanguage} onValueChange={(value: Language) => setCurrentLanguage(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 Indonesia</SelectItem>
                  <SelectItem value="en">🇬🇧 English</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="browse" className="text-lg py-3">
              📖 {labels.browse}
            </TabsTrigger>
            <TabsTrigger value="manage" className="text-lg py-3">
              ⚙️ {labels.manage}
            </TabsTrigger>
          </TabsList>

          {/* Browse Tab */}
          <TabsContent value="browse" className="space-y-6">
            {/* Search Controls */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  🔍 {currentLanguage === 'id' ? 'Pencarian Dokumen' : 'Document Search'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <Input
                      placeholder={labels.search}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchDocuments()}
                    />
                  </div>
                  <Select value={selectedDocumentType} onValueChange={(value) => setSelectedDocumentType(value as DocumentType | 'all')}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={labels.allTypes} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{labels.allTypes}</SelectItem>
                      <SelectItem value="article">{labels.article}</SelectItem>
                      <SelectItem value="law">{labels.law}</SelectItem>
                      <SelectItem value="decision">{labels.decision}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedCategory.toString()} onValueChange={(value) => setSelectedCategory(value === 'all' ? 'all' : Number(value))}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder={labels.allCategories} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{labels.allCategories}</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {currentLanguage === 'id' ? category.name_id : category.name_en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={searchDocuments} disabled={isLoading}>
                    {isLoading ? '⏳' : '🔍'} {currentLanguage === 'id' ? 'Cari' : 'Search'}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Search Results */}
            <div className="space-y-4">
              {isLoading ? (
                <Card>
                  <CardContent className="py-8">
                    <div className="text-center text-gray-500">
                      ⏳ {currentLanguage === 'id' ? 'Memuat dokumen...' : 'Loading documents...'}
                    </div>
                  </CardContent>
                </Card>
              ) : searchResults.documents.length === 0 ? (
                <Card>
                  <CardContent className="py-12">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📋</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">{labels.noResults}</h3>
                      <p className="text-gray-500">{labels.noResultsDesc}</p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <p className="text-gray-600">
                      {searchResults.total_count} {currentLanguage === 'id' ? 'dokumen ditemukan' : 'documents found'}
                    </p>
                  </div>
                  {searchResults.documents.map((document) => (
                    <Card key={document.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => handleDocumentClick(document.id)}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-xl mb-2 hover:text-blue-600 transition-colors">
                              {document.title}
                            </CardTitle>
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="secondary">
                                {getDocumentTypeLabel(document.document_type)}
                              </Badge>
                              <Badge variant="outline">
                                {getCategoryName(document.category_id)}
                              </Badge>
                              {document.document_number && (
                                <Badge variant="outline">
                                  {document.document_number}
                                </Badge>
                              )}
                            </div>
                            {document.summary && (
                              <CardDescription className="text-base line-clamp-3">
                                {document.summary}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center justify-between text-sm text-gray-500">
                          <div className="flex items-center gap-4">
                            {document.publication_date && (
                              <span>
                                📅 {labels.published}: {document.publication_date.toLocaleDateString(currentLanguage === 'id' ? 'id-ID' : 'en-US')}
                              </span>
                            )}
                            <span>
                              🕒 {labels.created}: {document.created_at.toLocaleDateString(currentLanguage === 'id' ? 'id-ID' : 'en-US')}
                            </span>
                          </div>
                        </div>
                        {document.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-3">
                            {document.tags.map((tag, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                #{tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </>
              )}
            </div>
          </TabsContent>

          {/* Management Tab */}
          <TabsContent value="manage" className="space-y-6">
            <Tabs defaultValue="categories" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="categories">📂 {labels.categories}</TabsTrigger>
                <TabsTrigger value="documents">📄 {labels.documents}</TabsTrigger>
              </TabsList>

              <TabsContent value="categories" className="mt-6">
                <CategoryManager 
                  language={currentLanguage} 
                  categories={categories}
                  onCategoriesChange={setCategories}
                />
              </TabsContent>

              <TabsContent value="documents" className="mt-6">
                <DocumentForm 
                  language={currentLanguage}
                  categories={categories}
                  onDocumentCreated={() => searchDocuments()}
                />
              </TabsContent>
            </Tabs>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default App;