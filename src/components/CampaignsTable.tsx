import React, { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Edit, 
  Trash2, 
  Search, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  Target,
  Play,
  Pause,
  Calendar
} from 'lucide-react';
import { useDeleteCampaign, useUpdateCampaign } from '@/hooks/useCampaigns';
import { CampaignPostsList } from '@/components/CampaignPostsList';
import type { Campaign, CampaignSortField } from '@/types/campaign';

interface CampaignsTableProps {
  campaigns: Campaign[];
  onEditCampaign?: (campaign: Campaign) => void;
}

type SortDirection = 'asc' | 'desc';

const statusConfig = {
  draft: {
    icon: Edit,
    color: 'bg-gray-500/10 text-gray-700 hover:bg-gray-500/20',
    label: 'Draft',
  },
  scheduled: {
    icon: Clock,
    color: 'bg-blue-500/10 text-blue-700 hover:bg-blue-500/20',
    label: 'Scheduled',
  },
  active: {
    icon: Play,
    color: 'bg-green-500/10 text-green-700 hover:bg-green-500/20',
    label: 'Active',
  },
  completed: {
    icon: CheckCircle,
    color: 'bg-purple-500/10 text-purple-700 hover:bg-purple-500/20',
    label: 'Completed',
  },
  cancelled: {
    icon: XCircle,
    color: 'bg-red-500/10 text-red-700 hover:bg-red-500/20',
    label: 'Cancelled',
  },
} as const;

export function CampaignsTable({ campaigns, onEditCampaign }: CampaignsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<CampaignSortField>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedCampaignForPosts, setSelectedCampaignForPosts] = useState<Campaign | null>(null);

  const { mutate: deleteCampaign, isPending: isDeleting } = useDeleteCampaign();
  const { mutate: updateCampaign, isPending: isUpdating } = useUpdateCampaign();

  const handleSort = (field: CampaignSortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getSortIcon = (field: CampaignSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc' ? <ArrowUp className="h-4 w-4" /> : <ArrowDown className="h-4 w-4" />;
  };

  const handleStatusChange = (campaign: Campaign, newStatus: Campaign['status']) => {
    updateCampaign({
      ...campaign,
      status: newStatus,
    });
  };

  const filteredAndSortedCampaigns = useMemo(() => {
    let filtered = campaigns;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(campaign =>
        campaign.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        campaign.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(campaign => campaign.status === statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      // Handle date fields
      if (sortField === 'startDate' || sortField === 'endDate' || sortField === 'createdAt') {
        const aTime = new Date(aValue as Date).getTime();
        const bTime = new Date(bValue as Date).getTime();
        return sortDirection === 'asc' ? aTime - bTime : bTime - aTime;
      }

      // Handle string fields
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const aStr = aValue.toLowerCase();
        const bStr = bValue.toLowerCase();
        if (sortDirection === 'asc') {
          return aStr < bStr ? -1 : aStr > bStr ? 1 : 0;
        } else {
          return aStr > bStr ? -1 : aStr < bStr ? 1 : 0;
        }
      }

      // Handle numeric fields
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return 0;
    });

    return filtered;
  }, [campaigns, searchTerm, statusFilter, sortField, sortDirection]);

  const formatDateRange = (startDate: Date, endDate: Date) => {
    const start = startDate.toLocaleDateString();
    const end = endDate.toLocaleDateString();
    return `${start} - ${end}`;
  };

  const getProgress = (campaign: Campaign) => {
    if (campaign.totalPosts === 0) return 0;
    return Math.round((campaign.completedPosts / campaign.totalPosts) * 100);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search campaigns..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="scheduled">Scheduled</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
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
                  Campaign {getSortIcon('title')}
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
                  onClick={() => handleSort('startDate')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Date Range {getSortIcon('startDate')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('totalPosts')}
                  className="h-auto p-0 font-semibold hover:bg-transparent"
                >
                  Progress {getSortIcon('totalPosts')}
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedCampaigns.map((campaign) => {
              const config = statusConfig[campaign.status];
              const Icon = config.icon;
              const progress = getProgress(campaign);

              return (
                <TableRow key={campaign.id}>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="font-medium truncate max-w-[250px]" title={campaign.title}>
                        {campaign.title}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-[250px]" title={campaign.description}>
                        {campaign.description}
                      </div>
                      {campaign.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {campaign.tags.slice(0, 3).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {campaign.tags.length > 3 && (
                            <Badge variant="outline" className="text-xs">
                              +{campaign.tags.length - 3}
                            </Badge>
                          )}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className={config.color}>
                      <Icon className="h-3 w-3 mr-1" />
                      {config.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      {formatDateRange(campaign.startDate, campaign.endDate)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="text-sm font-medium">
                        {campaign.completedPosts}/{campaign.totalPosts} posts
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {progress}% complete
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => setSelectedCampaignForPosts(campaign)}
                        title="View Posts"
                      >
                        <Calendar className="h-4 w-4" />
                      </Button>
                      
                      {onEditCampaign && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onEditCampaign(campaign)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {campaign.status === 'draft' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusChange(campaign, 'scheduled')}
                          disabled={isUpdating}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {campaign.status === 'active' && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleStatusChange(campaign, 'completed')}
                          disabled={isUpdating}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" disabled={isDeleting}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will permanently delete the campaign "{campaign.title}" and all associated data.
                              This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteCampaign(campaign.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Delete Campaign
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {filteredAndSortedCampaigns.length === 0 && (
        <div className="text-center py-12">
          <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No campaigns found</h3>
          <p className="text-muted-foreground">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first campaign to get started'
            }
          </p>
        </div>
      )}

      {/* Campaign Posts Dialog */}
      <Dialog open={!!selectedCampaignForPosts} onOpenChange={() => setSelectedCampaignForPosts(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>
              {selectedCampaignForPosts?.title} - Posts
            </DialogTitle>
            <DialogDescription>
              View and manage posts for this campaign
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto">
            {selectedCampaignForPosts && (
              <CampaignPostsList campaignId={selectedCampaignForPosts.id} />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 