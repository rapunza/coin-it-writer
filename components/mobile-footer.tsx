import React from "react";
import Link from "next/link";
import { Coins, Users, TrendingUp, FileText, Home } from "lucide-react";

export default function MobileFooter() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t shadow flex justify-around items-center h-14 sm:hidden">
      <Link href="/" className="flex flex-col items-center text-xs text-gray-700 hover:text-purple-600">
        <Home className="h-5 w-5 mb-1" />
        Home
      </Link>
      <Link href="/dashboard" className="flex flex-col items-center text-xs text-gray-700 hover:text-purple-600">
        <Coins className="h-5 w-5 mb-1" />
        Coins
      </Link>
      <Link href="/channels" className="flex flex-col items-center text-xs text-gray-700 hover:text-purple-600">
        <TrendingUp className="h-5 w-5 mb-1" />
        Channels
      </Link>
      <Link href="/creators" className="flex flex-col items-center text-xs text-gray-700 hover:text-purple-600">
        <Users className="h-5 w-5 mb-1" />
        Creators
      </Link>
      <Link href="/leaderboard" className="flex flex-col items-center text-xs text-gray-700 hover:text-purple-600">
        <FileText className="h-5 w-5 mb-1" />
        Leaderboard
      </Link>
    </nav>
  );
}
