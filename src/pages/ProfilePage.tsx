import React from 'react';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { EditProfileForm } from '@/components/EditProfileForm';
import { LoginArea } from '@/components/auth/LoginArea';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { genUserName } from '@/lib/genUserName';
import { Edit, Verified } from 'lucide-react';
import type { NostrMetadata } from '@nostrify/nostrify';

export function ProfilePage() {
  const { user, metadata } = useCurrentUser();

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <PageHeader
          title="Profile"
          description="View and edit your profile information"
        />
        <Card className="max-w-md mx-auto">
          <CardHeader className="text-center">
            <CardTitle>Sign in to view your profile</CardTitle>
            <CardDescription>
              You need to be logged in to access your profile page
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <LoginArea className="max-w-60" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 space-y-8">
      <PageHeader
        title="Profile"
        description="View and edit your profile information"
      />

      {/* Profile View */}
      <ProfileView user={user} metadata={metadata} />

      {/* Edit Profile Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Edit Profile
          </CardTitle>
          <CardDescription>
            Update your profile information that will be displayed to others
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EditProfileForm />
        </CardContent>
      </Card>
    </div>
  );
}

interface ProfileViewProps {
  user: { pubkey: string };
  metadata?: NostrMetadata;
}

function ProfileView({ user, metadata }: ProfileViewProps) {
  const displayName = metadata?.display_name || metadata?.name || genUserName(user.pubkey);
  const userName = metadata?.name || genUserName(user.pubkey);

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card>
        <div className="relative">
          {/* Banner */}
          {metadata?.banner && (
            <div className="h-48 overflow-hidden rounded-t-lg">
              <img
                src={metadata.banner}
                alt="Profile banner"
                className="w-full h-full object-cover"
              />
            </div>
          )}
          
          {/* Profile Info */}
          <CardContent className={`${metadata?.banner ? 'pt-16' : 'pt-6'} relative`}>
            {/* Avatar */}
            <div className={`${metadata?.banner ? 'absolute -top-12 left-6' : ''}`}>
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={metadata?.picture} alt={displayName} />
                <AvatarFallback className="text-lg">
                  {displayName.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Bio */}
            <div className={`${metadata?.banner ? 'ml-32' : 'ml-28'} space-y-2`}>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{displayName}</h1>
                {metadata?.nip05 && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Verified className="h-3 w-3" />
                    Verified
                  </Badge>
                )}
                {metadata?.bot && (
                  <Badge variant="outline">
                    Bot
                  </Badge>
                )}
              </div>
              {userName !== displayName && (
                <p className="text-muted-foreground">@{userName}</p>
              )}
              {metadata?.about && (
                <p className="text-sm leading-relaxed">{metadata.about}</p>
              )}
            </div>
          </CardContent>
        </div>
      </Card>

      {/* Profile Details */}
      <div className="grid gap-6 md:grid-cols-1">
        {/* Account Details */}
        <Card>
          <CardHeader>
            <CardTitle>Account Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground">
                Public Key
              </label>
              <p className="text-sm font-mono break-all bg-muted p-2 rounded mt-1">
                {user.pubkey}
              </p>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Account Type</span>
              <Badge variant={metadata?.bot ? "secondary" : "default"}>
                {metadata?.bot ? "Bot Account" : "Regular Account"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 