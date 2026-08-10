"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { NewSketchForm } from "@/components/forms/NewSketchForm";
import { NewThoughtForm } from "@/components/forms/NewThoughtForm";
import { NewStoryForm } from "@/components/forms/NewStoryForm";

export function CreateTabs() {
  const [tab, setTab] = useState("sketch");

  return (
    <Tabs value={tab} onValueChange={(value) => setTab(String(value))}>
      <TabsList>
        <TabsTrigger value="sketch">Sketch</TabsTrigger>
        <TabsTrigger value="thought">Thought</TabsTrigger>
        <TabsTrigger value="story">Story</TabsTrigger>
      </TabsList>
      <TabsContent value="sketch" className="pt-6">
        <NewSketchForm />
      </TabsContent>
      <TabsContent value="thought" className="pt-6">
        <NewThoughtForm />
      </TabsContent>
      <TabsContent value="story" className="pt-6">
        <NewStoryForm />
      </TabsContent>
    </Tabs>
  );
}
