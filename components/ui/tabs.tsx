"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

export interface TabsProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultValue?: string;
}

export function Tabs({ children, className, defaultValue, ...props }: TabsProps) {
  const [value, setValue] = React.useState(defaultValue);
  return (
    <div className={cn("w-full", className)} {...props}>
      {React.Children.map(children, (child: any) => React.cloneElement(child, { value, setValue }))}
    </div>
  );
}

export function TabsList({ children, className, value, setValue, ...props }: any) {
  return (
    <div className={cn("inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground transition-colors duration-300", className)} {...props}>
      {React.Children.map(children, (child: any) => React.cloneElement(child, { value, setValue }))}
    </div>
  );
}

export function TabsTrigger({ children, className, value, setValue, tabValue, ...props }: any) {
  const active = value === tabValue;
  return (
    <button
      onClick={() => setValue(tabValue)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium transition-all duration-200",
        active ? "bg-background text-foreground shadow-soft" : "text-muted-foreground hover:text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function TabsContent({ children, className, value, tabValue, ...props }: any) {
  if (value !== tabValue) return null;
  return (
    <div className={cn("mt-4", className)} {...props}>
      {children}
    </div>
  );
}
