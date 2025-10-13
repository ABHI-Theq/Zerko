import { Button } from "@/components/ui/button";
import { PhoneOff } from "lucide-react";

export default function InterviewHeader({ post }: { post: string }) {
  return (
    <div className="flex justify-between items-center px-6 py-3 bg-white border-b shadow-sm z-20">
      <h1 className="text-lg font-semibold text-gray-800">Interview for {post}</h1>
      <Button variant="destructive">
        <PhoneOff className="w-4 h-4 mr-2" /> End Interview
      </Button>
    </div>
  );
}
