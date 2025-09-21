"use client"

import { useState } from "react"
import { SearchBar } from "@/components/search-bar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink } from "lucide-react"
import Link from "next/link"

interface SearchResult {
  id: string
  data: {
    title: string
    content: string
    type: string
    createdAt: string
    metadata?: Record<string, any>
  }
  score: number
}

export default function SearchPage() {
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(null)

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case "assessment":
        return "bg-blue-100 text-blue-800"
      case "result":
        return "bg-green-100 text-green-800"
      case "recommendation":
        return "bg-purple-100 text-purple-800"
      case "profile":
        return "bg-orange-100 text-orange-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getNavigationLink = (result: SearchResult) => {
    switch (result.data.type) {
      case "assessment":
        return "/dashboard"
      case "result":
        return "/results"
      case "recommendation":
        return "/results"
      case "profile":
        return "/profile"
      default:
        return "/dashboard"
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link href="/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Search</h1>
          <p className="text-gray-600">Search through your assessments, results, and recommendations</p>
        </div>

        <div className="mb-8">
          <SearchBar onResultSelect={setSelectedResult} className="mx-auto" />
        </div>

        {selectedResult && (
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2">{selectedResult.data.title}</CardTitle>
                  <CardDescription className="text-sm">{formatDate(selectedResult.data.createdAt)}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={getTypeColor(selectedResult.data.type)}>{selectedResult.data.type}</Badge>
                  <Link href={getNavigationLink(selectedResult)}>
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed">{selectedResult.data.content}</p>
              </div>

              {selectedResult.data.metadata && Object.keys(selectedResult.data.metadata).length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <h4 className="font-medium text-gray-900 mb-3">Additional Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {Object.entries(selectedResult.data.metadata).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-1">
                        <span className="text-sm font-medium text-gray-600 capitalize">{key.replace(/_/g, " ")}:</span>
                        <span className="text-sm text-gray-900">
                          {typeof value === "object" ? JSON.stringify(value) : String(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>Search Relevance Score</span>
                  <span className="font-medium">{Math.round(selectedResult.score * 100)}%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!selectedResult && (
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Searching</h3>
              <p className="text-gray-600">
                Use the search bar above to find your assessments, results, and recommendations. You can filter by type
                or search across all content.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
