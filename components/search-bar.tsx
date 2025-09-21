"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Filter, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface SearchBarProps {
  onResultSelect?: (result: SearchResult) => void
  placeholder?: string
  className?: string
}

export function SearchBar({
  onResultSelect,
  placeholder = "Search assessments, results, and recommendations...",
  className,
}: SearchBarProps) {
  const [query, setQuery] = useState("")
  const [type, setType] = useState<string>("all")
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  useEffect(() => {
    const searchTimeout = setTimeout(() => {
      if (query.trim().length > 2) {
        performSearch()
      } else {
        setResults([])
        setShowResults(false)
      }
    }, 300)

    return () => clearTimeout(searchTimeout)
  }, [query, type])

  const performSearch = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        q: query,
        ...(type !== "all" && { type }),
      })

      const response = await fetch(`/api/search?${params}`)
      const data = await response.json()

      if (response.ok) {
        setResults(data.results || [])
        setShowResults(true)
      } else {
        console.error("Search error:", data.error)
        setResults([])
      }
    } catch (error) {
      console.error("Search failed:", error)
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }

  const clearSearch = () => {
    setQuery("")
    setResults([])
    setShowResults(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  return (
    <div ref={searchRef} className={`relative w-full max-w-2xl ${className}`}>
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            type="text"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        <Select value={type} onValueChange={setType}>
          <SelectTrigger className="w-40">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="assessment">Assessments</SelectItem>
            <SelectItem value="result">Results</SelectItem>
            <SelectItem value="recommendation">Recommendations</SelectItem>
            <SelectItem value="profile">Profile</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showResults && (
        <Card className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto shadow-lg">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">{isLoading ? "Searching..." : `${results.length} results found`}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {results.length === 0 && !isLoading ? (
              <p className="text-sm text-gray-500 py-4 text-center">No results found for "{query}"</p>
            ) : (
              <div className="space-y-3">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className="p-3 rounded-lg border hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => {
                      onResultSelect?.(result)
                      setShowResults(false)
                    }}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-medium text-sm line-clamp-1">{result.data.title}</h4>
                      <Badge className={`text-xs ${getTypeColor(result.data.type)}`}>{result.data.type}</Badge>
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2 mb-2">{result.data.content}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{formatDate(result.data.createdAt)}</span>
                      <span>Score: {Math.round(result.score * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
