import React, { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

interface PaginationControlProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function PaginationControl({ currentPage, totalPages, onPageChange }: PaginationControlProps) {
  const [inputValue, setInputValue] = useState(currentPage.toString())

  useEffect(() => {
    setInputValue(currentPage.toString())
  }, [currentPage])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      let page = parseInt(inputValue, 10)
      if (isNaN(page)) {
        setInputValue(currentPage.toString())
        return
      }
      if (page < 1) page = 1
      if (page > totalPages) page = totalPages
      setInputValue(page.toString())
      onPageChange(page)
    }
  }

  const handleBlur = () => {
    setInputValue(currentPage.toString())
  }

  return (
    <div className="flex items-center gap-2">
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(Math.max(1, currentPage - 1))} 
        disabled={currentPage === 1}
      >
        Trang trước
      </Button>
      <div className="flex items-center gap-2 px-2 text-sm font-medium">
        Trang 
        <Input 
          type="text" 
          value={inputValue} 
          onChange={(e) => setInputValue(e.target.value)} 
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          className="w-12 h-8 text-center px-1" 
        /> 
        / {totalPages}
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))} 
        disabled={currentPage === totalPages}
      >
        Trang sau
      </Button>
    </div>
  )
}
