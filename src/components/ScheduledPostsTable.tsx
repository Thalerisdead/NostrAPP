import React, { useState, useMemo } from 'react';
import { Calendar, Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2, Search, Filter, ArrowUpDown, ArrowUp, ArrowDown, Image, Plus, CalendarDays, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ScheduledPost {
  id: string;
  title: string;
  content: string;
  publishAt: Date;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  createdAt: Date;
  targetKind: number;
  images?: string[];
  publishedEventId?: string;
  error?: string;
}

interface ScheduledPostsTableProps {
  posts: ScheduledPost[];
  onCancelPost: (post: ScheduledPost) => void;
  isCancelling: boolean;
  onSchedulePost?: () => void;
}

type SortField = 'title' | 'publishAt' | 'status' | 'createdAt';
type SortDirection = 'asc' | 'desc';

const statusConfig = {
  scheduled: {
    icon: Clock,
    color: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
    label: 'Scheduled',
  },
  published: {
    icon: CheckCircle,
    color: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
    label: 'Published',
  },
  failed: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
    label: 'Failed',
  },
  cancelled: {
    icon: AlertCircle,
    color: 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20',
    label: 'Cancelled',
  },
} as const;

export function ScheduledPostsTable({ posts, onCancelPost, isCancelling, onSchedulePost }: ScheduledPostsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('publishAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [previewPost, setPreviewPost] = useState<ScheduledPost | null>(null);
  const [showDateFilters, setShowDateFilters] = useState(false);
  
  // Date filters - separate temp and applied states
  const [tempPublishDateFrom, setTempPublishDateFrom] = useState('');
  const [tempPublishDateTo, setTempPublishDateTo] = useState('');
  const [appliedPublishDateFrom, setAppliedPublishDateFrom] = useState('');
  const [appliedPublishDateTo, setAppliedPublishDateTo] = useState('');

  const formatRelativeTime = (date: Date) => {
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMs < 0) {
      return 'Past due';
    }

    if (diffMins < 60) {
      return `in ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }

    if (diffHours < 24) {
      return `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    }

    return `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const applyDateFilters = () => {
    setAppliedPublishDateFrom(tempPublishDateFrom);
    setAppliedPublishDateTo(tempPublishDateTo);
  };

  const clearDateFilters = () => {
    setTempPublishDateFrom('');
    setTempPublishDateTo('');
    setAppliedPublishDateFrom('');
    setAppliedPublishDateTo('');
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || appliedPublishDateFrom || appliedPublishDateTo;
  const hasUnappliedDateChanges = tempPublishDateFrom !== appliedPublishDateFrom || tempPublishDateTo !== appliedPublishDateTo;

  const clearAllFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    clearDateFilters();
  };

  const filteredAndSortedPosts = useMemo(() => {
    let filtered = posts;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        post.content.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(post => post.status === statusFilter);
    }

    // Apply publish date filters (only applied ones)
    if (appliedPublishDateFrom) {
      const fromDate = new Date(appliedPublishDateFrom);
      fromDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(post => post.publishAt >= fromDate);
    }
    if (appliedPublishDateTo) {
      const toDate = new Date(appliedPublishDateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(post => post.publishAt <= toDate);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case 'title':
          aValue = a.title.toLowerCase();
          bValue = b.title.toLowerCase();
          break;
        case 'publishAt':
          aValue = a.publishAt.getTime();
          bValue = b.publishAt.getTime();
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
          aValue = a.createdAt.getTime();
          bValue = b.createdAt.getTime();
          break;
        default:
          return 0;
      }

      if (aValue < bValue) {
        return sortDirection === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortDirection === 'asc' ? 1 : -1;
      }
      return 0;
    });

    return filtered;
  }, [posts, searchTerm, statusFilter, appliedPublishDateFrom, appliedPublishDateTo, sortField, sortDirection]);

  const statusCounts = useMemo(() => {
    return posts.reduce((acc, post) => {
      acc[post.status] = (acc[post.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }, [posts]);

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Posts Overview</CardTitle>
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="h-4 w-4 mr-2" />
                Clear All Filters
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search posts by title or content..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status ({posts.length})</SelectItem>
                  <SelectItem value="scheduled">Scheduled ({statusCounts.scheduled || 0})</SelectItem>
                  <SelectItem value="published">Published ({statusCounts.published || 0})</SelectItem>
                  <SelectItem value="failed">Failed ({statusCounts.failed || 0})</SelectItem>
                  <SelectItem value="cancelled">Cancelled ({statusCounts.cancelled || 0})</SelectItem>
                </SelectContent>
              </Select>
              
              <Collapsible open={showDateFilters} onOpenChange={setShowDateFilters}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline">
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Date Filters
                    {(appliedPublishDateFrom || appliedPublishDateTo) && (
                      <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center">
                        !
                      </Badge>
                    )}
                  </Button>
                </CollapsibleTrigger>
              </Collapsible>
            </div>
          </div>

          {/* Date Filters */}
          <Collapsible open={showDateFilters} onOpenChange={setShowDateFilters}>
            <CollapsibleContent className="space-y-4">
              <div className="p-4 border rounded-lg bg-muted/30">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Filter by Publish Date</Label>
                    {(appliedPublishDateFrom || appliedPublishDateTo) && (
                      <Badge variant="secondary" className="text-xs">
                        Active Filter
                      </Badge>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="publish-from" className="text-xs text-muted-foreground">From Date</Label>
                      <Input
                        id="publish-from"
                        type="date"
                        value={tempPublishDateFrom}
                        onChange={(e) => setTempPublishDateFrom(e.target.value)}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label htmlFor="publish-to" className="text-xs text-muted-foreground">To Date</Label>
                      <Input
                        id="publish-to"
                        type="date"
                        value={tempPublishDateTo}
                        onChange={(e) => setTempPublishDateTo(e.target.value)}
                        min={tempPublishDateFrom}
                        className="text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button 
                      size="sm" 
                      onClick={applyDateFilters}
                      disabled={!tempPublishDateFrom && !tempPublishDateTo}
                      className="flex-1"
                    >
                      Apply Filter
                      {hasUnappliedDateChanges && (
                        <Badge variant="secondary" className="ml-2 h-4 w-4 p-0 flex items-center justify-center text-xs">
                          !
                        </Badge>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={clearDateFilters}
                      disabled={!tempPublishDateFrom && !tempPublishDateTo && !appliedPublishDateFrom && !appliedPublishDateTo}
                    >
                      Clear
                    </Button>
                  </div>

                  {(appliedPublishDateFrom || appliedPublishDateTo) && (
                    <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded border">
                      <strong>Active filter:</strong> 
                      {appliedPublishDateFrom && ` From ${new Date(appliedPublishDateFrom).toLocaleDateString()}`}
                      {appliedPublishDateFrom && appliedPublishDateTo && ' '}
                      {appliedPublishDateTo && ` To ${new Date(appliedPublishDateTo).toLocaleDateString()}`}
                    </div>
                  )}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Status Summary */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = statusConfig[status as keyof typeof statusConfig];
              const Icon = config.icon;
              return (
                <Badge key={status} variant="secondary" className={config.color}>
                  <Icon className="h-3 w-3 mr-1" />
                  {config.label}: {count}
                </Badge>
              );
            })}
            {filteredAndSortedPosts.length !== posts.length && (
              <Badge variant="outline" className="border-orange-300 text-orange-700">
                Filtered: {filteredAndSortedPosts.length} of {posts.length}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Posts Table */}
      <Card>
        <CardContent className="p-0">
          {filteredAndSortedPosts.length === 0 ? (
            <div className="py-12 text-center">
              <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold text-lg mb-2">
                {posts.length === 0 ? 'No posts yet' : 'No posts match your filters'}
              </h3>
              <p className="text-muted-foreground mb-4">
                {posts.length === 0 
                  ? 'Schedule your first post to get started with automated publishing.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {posts.length === 0 && onSchedulePost && (
                <Button onClick={onSchedulePost}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Your First Post
                </Button>
              )}
              {posts.length > 0 && hasActiveFilters && (
                <Button variant="outline" onClick={clearAllFilters}>
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[300px]">
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('title')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Title {getSortIcon('title')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('status')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Status {getSortIcon('status')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('publishAt')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Publish Date {getSortIcon('publishAt')}
                      </Button>
                    </TableHead>
                    <TableHead>
                      <Button
                        variant="ghost"
                        onClick={() => handleSort('createdAt')}
                        className="h-auto p-0 font-semibold hover:bg-transparent"
                      >
                        Created {getSortIcon('createdAt')}
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedPosts.map((post) => {
                    const config = statusConfig[post.status];
                    const Icon = config.icon;
                    const isScheduled = post.status === 'scheduled';
                    const isPastDue = isScheduled && post.publishAt < new Date();

                    return (
                      <TableRow key={post.id} className={isPastDue ? 'bg-orange-50/50' : ''}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium truncate max-w-[250px]" title={post.title}>
                              {post.title}
                            </div>
                            <div className="text-sm text-muted-foreground truncate max-w-[250px]" title={post.content}>
                              {post.content}
                            </div>
                            {post.images && post.images.length > 0 && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Image className="h-3 w-3" />
                                {post.images.length} image{post.images.length !== 1 ? 's' : ''}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <Badge variant="secondary" className={config.color}>
                              <Icon className="h-3 w-3 mr-1" />
                              {config.label}
                            </Badge>
                            {isScheduled && (
                              <Badge variant="outline" className="text-xs">
                                <Calendar className="h-3 w-3 mr-1" />
                                {formatRelativeTime(post.publishAt)}
                              </Badge>
                            )}
                            {isPastDue && (
                              <Badge variant="destructive" className="text-xs">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Past Due
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div>{post.publishAt.toLocaleDateString()}</div>
                            <div className="text-muted-foreground">
                              {post.publishAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {post.createdAt.toLocaleDateString()}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setPreviewPost(post)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            {isScheduled && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="outline" disabled={isCancelling}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Cancel scheduled post?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      This will cancel the scheduled post "{post.title}" and prevent it from being published.
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Keep Scheduled</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => onCancelPost(post)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Cancel Post
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewPost} onOpenChange={() => setPreviewPost(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle>{previewPost?.title || 'Post Preview'}</DialogTitle>
            <DialogDescription>
              {previewPost && `Scheduled for ${previewPost.publishAt.toLocaleString()}`}
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="flex-1 px-6 py-4">
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <p className="whitespace-pre-wrap">{previewPost?.content}</p>
              </div>
              
              {previewPost?.images && previewPost.images.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Image className="h-4 w-4" />
                    Images ({previewPost.images.length})
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    {previewPost.images.map((imageUrl, index) => (
                      <img
                        key={index}
                        src={imageUrl}
                        alt={`Image ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          console.error('Failed to load image:', imageUrl);
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {previewPost?.error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-sm text-red-800 mb-2">Error Details</h4>
                  <p className="text-sm text-red-700">{previewPost.error}</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
} 