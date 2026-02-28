"use client"

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Search, Activity } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function DoctorPageSkeleton() {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <div className="p-4 md:p-6 lg:p-8 space-y-6 lg:min-w-6xl max-w-6xl mx-auto w-full">
                {/* Welcome Section Skeleton */}
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 md:h-9" />
                    <Skeleton className="h-5 w-96 max-w-full" />
                </div>

                {/* Search Bar Skeleton */}
                <div className="space-y-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Cari pasien..."
                            disabled
                            className="pl-10"
                        />
                    </div>
                </div>

                {/* User Cards Grid Skeleton */}
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Card key={i}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Skeleton className="h-10 w-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-5 w-32" />
                                                <Skeleton className="h-4 w-40" />
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {/* Badges */}
                                    <div className="flex gap-1">
                                        <Skeleton className="h-5 w-20" />
                                        <Skeleton className="h-5 w-16" />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-32" />
                                    </div>

                                    {/* UID */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-20" />
                                        <div className="flex items-center gap-2">
                                            <Skeleton className="h-8 flex-1" />
                                            <Skeleton className="h-8 w-10" />
                                        </div>
                                    </div>

                                    {/* Created Date */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-16" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>

                                    {/* Last Sign In */}
                                    <div className="space-y-1">
                                        <Skeleton className="h-4 w-28" />
                                        <Skeleton className="h-4 w-48" />
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex gap-2 pt-2">
                                        <Skeleton className="h-9 flex-1" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}