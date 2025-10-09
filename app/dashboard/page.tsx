"use client";
import { useSession, signIn } from "next-auth/react";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AnalyticsChart from "@/components/AnalyticsChart";

const mockPRs = [
  { id: 1, title: "Fix authentication bug in login flow", status: "✅ Approved", summary: "Code looks good. Minor style improvements suggested." },
  { id: 2, title: "Add dark mode support", status: "⏳ Pending", summary: "AI is analyzing this PR. Check back soon." },
  { id: 3, title: "Refactor API endpoints", status: "⚠️ Issues Found", summary: "Found 3 potential issues: unused imports, missing error handling." },
  { id: 4, title: "Update dependencies", status: "✅ Approved", summary: "All dependencies are up to date and secure." },
];

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container-md py-8">
        {/* User Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center gap-4">
              <Avatar src={mockUser.avatar} alt={mockUser.name} className="h-16 w-16" />
              <div>
                <CardTitle>{mockUser.name}</CardTitle>
                <CardDescription>@{mockUser.username}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="prs">
          <TabsList>
            <TabsTrigger tabValue="prs">Pull Requests</TabsTrigger>
            <TabsTrigger tabValue="analytics">Analytics</TabsTrigger>
            <TabsTrigger tabValue="settings">Settings</TabsTrigger>
          </TabsList>

          {/* Pull Requests Tab */}
          <TabsContent tabValue="prs">
            <Card>
              <CardHeader>
                <CardTitle>Recent Pull Requests</CardTitle>
                <CardDescription>AI-reviewed pull requests from your repositories</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PR Title</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>AI Summary</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mockPRs.map((pr) => (
                      <TableRow key={pr.id}>
                        <TableCell className="font-medium">{pr.title}</TableCell>
                        <TableCell>{pr.status}</TableCell>
                        <TableCell className="text-gray-600">{pr.summary}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent tabValue="analytics">
            <Card>
              <CardHeader>
                <CardTitle>Review Analytics</CardTitle>
                <CardDescription>Track your code review activity and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">Weekly Activity</h4>
                  <AnalyticsChart />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600">24</div>
                    <div className="text-sm text-gray-600">PRs Reviewed</div>
                  </div>
                  <div className="p-4 bg-violet-50 rounded-lg">
                    <div className="text-2xl font-bold text-violet-600">18</div>
                    <div className="text-sm text-gray-600">Issues Found</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">92%</div>
                    <div className="text-sm text-gray-600">Code Quality</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent tabValue="settings">
            <Card>
              <CardHeader>
                <CardTitle>Custom Review Rules</CardTitle>
                <CardDescription>Define custom rules for AI to enforce during code reviews</CardDescription>
              </CardHeader>
              <CardContent>
                <form className="space-y-4">
                  <div>
                    <Label htmlFor="rule-name">Rule Name</Label>
                    <Input id="rule-name" placeholder="e.g., Enforce TypeScript strict mode" />
                  </div>
                  <div>
                    <Label htmlFor="rule-description">Description</Label>
                    <Textarea
                      id="rule-description"
                      placeholder="Describe what this rule checks for..."
                      rows={4}
                    />
                  </div>
                  <div>
                    <Label htmlFor="severity">Severity</Label>
                    <Input id="severity" placeholder="error | warning | info" />
                  </div>
                  <Button type="button">Save Rule</Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
