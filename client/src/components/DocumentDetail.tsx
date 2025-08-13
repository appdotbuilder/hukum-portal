import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { trpc } from '@/utils/trpc';
import { useState, useEffect } from 'react';
import type { LocalizedDocument, Language } from '../../../server/src/schema';

interface DocumentDetailProps {
  document: LocalizedDocument;
  language: Language;
  onBack: () => void;
  onLanguageChange: (language: Language) => void;
}

export function DocumentDetail({ document: initialDocument, language, onBack, onLanguageChange }: DocumentDetailProps) {
  const [document, setDocument] = useState(initialDocument);
  const [isLoading, setIsLoading] = useState(false);

  // Reload document when language changes
  useEffect(() => {
    const loadDocument = async () => {
      if (language !== (initialDocument as any).currentLanguage) {
        setIsLoading(true);
        try {
          const updatedDocument = await trpc.getLegalDocument.query({
            id: initialDocument.id,
            language
          });
          setDocument(updatedDocument);
        } catch (error) {
          console.error('Failed to load document in new language:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadDocument();
  }, [language, initialDocument.id, initialDocument]);

  const labels = language === 'id' ? {
    back: 'Kembali',
    documentType: 'Jenis Dokumen',
    category: 'Kategori',
    documentNumber: 'Nomor Dokumen',
    publicationDate: 'Tanggal Terbit',
    effectiveDate: 'Tanggal Berlaku',
    tags: 'Tag',
    downloadFile: 'Unduh File',
    summary: 'Ringkasan',
    content: 'Isi Dokumen',
    created: 'Dibuat',
    updated: 'Diperbarui',
    article: 'Artikel',
    law: 'Undang-Undang',
    decision: 'Putusan'
  } : {
    back: 'Back',
    documentType: 'Document Type',
    category: 'Category',
    documentNumber: 'Document Number',
    publicationDate: 'Publication Date',
    effectiveDate: 'Effective Date',
    tags: 'Tags',
    downloadFile: 'Download File',
    summary: 'Summary',
    content: 'Document Content',
    created: 'Created',
    updated: 'Updated',
    article: 'Article',
    law: 'Law',
    decision: 'Decision'
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeLabels = {
      article: labels.article,
      law: labels.law,
      decision: labels.decision
    };
    return typeLabels[type as keyof typeof typeLabels] || type;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '-';
    return date.toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="py-12">
              <div className="text-center text-gray-500">
                ⏳ {language === 'id' ? 'Memuat dokumen...' : 'Loading document...'}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={onBack} className="flex items-center gap-2">
                ← {labels.back}
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">⚖️ {document.title}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary">
                    {getDocumentTypeLabel(document.document_type)}
                  </Badge>
                  <Badge variant="outline">
                    {document.category_name}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Select value={language} onValueChange={onLanguageChange}>
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
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar - Document Metadata */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="text-lg">📋 {language === 'id' ? 'Informasi Dokumen' : 'Document Information'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">{labels.documentType}</dt>
                  <dd className="mt-1">
                    <Badge variant="secondary">
                      {getDocumentTypeLabel(document.document_type)}
                    </Badge>
                  </dd>
                </div>

                <div>
                  <dt className="text-sm font-medium text-gray-500">{labels.category}</dt>
                  <dd className="mt-1">
                    <Badge variant="outline">
                      {document.category_name}
                    </Badge>
                  </dd>
                </div>

                {document.document_number && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{labels.documentNumber}</dt>
                    <dd className="mt-1 text-sm">{document.document_number}</dd>
                  </div>
                )}

                {document.publication_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{labels.publicationDate}</dt>
                    <dd className="mt-1 text-sm">{formatDate(document.publication_date)}</dd>
                  </div>
                )}

                {document.effective_date && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{labels.effectiveDate}</dt>
                    <dd className="mt-1 text-sm">{formatDate(document.effective_date)}</dd>
                  </div>
                )}

                {document.tags.length > 0 && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">{labels.tags}</dt>
                    <dd className="mt-2 flex flex-wrap gap-1">
                      {document.tags.map((tag, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          #{tag}
                        </Badge>
                      ))}
                    </dd>
                  </div>
                )}

                {document.file_url && (
                  <div>
                    <Button asChild className="w-full" variant="outline">
                      <a href={document.file_url} target="_blank" rel="noopener noreferrer">
                        📄 {labels.downloadFile}
                      </a>
                    </Button>
                  </div>
                )}

                <Separator />

                <div className="text-xs text-gray-500 space-y-1">
                  <div>{labels.created}: {formatDate(document.created_at)}</div>
                  <div>{labels.updated}: {formatDate(document.updated_at)}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            <div className="space-y-6">
              {/* Summary */}
              {document.summary && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      📝 {labels.summary}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-gray max-w-none">
                      <p className="text-lg leading-relaxed text-gray-700">
                        {document.summary}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Document Content */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    📄 {labels.content}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="max-h-[800px]">
                    <div className="prose prose-gray max-w-none">
                      <div 
                        className="whitespace-pre-wrap leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: document.content.replace(/\n/g, '<br />') }}
                      />
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}