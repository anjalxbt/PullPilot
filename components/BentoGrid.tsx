"use client";

import React from "react";
import { motion } from "framer-motion";

interface BentoItemProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
  delay?: number;
}

const BentoItem = ({ title, description, icon, className = "", delay = 0 }: BentoItemProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={`group relative overflow-hidden rounded-2xl bg-card border border-gray-800 p-8 hover:border-gray-700 transition-all duration-300 ${className}`}
    >
      <div className="relative z-10">
        <motion.div 
          className="text-5xl mb-4"
          whileHover={{ scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-2xl font-bold mb-3 text-foreground">{title}</h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>
      
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
    </motion.div>
  );
};

interface BentoGridProps {
  items: Array<{
    title: string;
    description: string;
    icon: React.ReactNode;
  }>;
}

export default function BentoGrid({ items }: BentoGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
      {items.map((item, index) => (
        <BentoItem
          key={index}
          title={item.title}
          description={item.description}
          icon={item.icon}
          className={
            index === 0 ? "md:col-span-2 lg:col-span-2" : 
            index === 1 ? "md:col-span-2 lg:col-span-2" :
            ""
          }
          delay={index * 0.1}
        />
      ))}
    </div>
  );
}
