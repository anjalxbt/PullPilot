import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import React, { ReactNode } from "react";

export default function FeatureCard({ title, description, icon }: { title: string; description: string; icon?: ReactNode }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <div className="text-3xl mb-2">{icon}</div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-sm text-gray-500">Learn more →</div>
      </CardContent>
    </Card>
  );
}
