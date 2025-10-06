import { useState, useCallback, useRef } from 'react'
import { useAutocomplete } from './useAPI'

export interface LLMAutocompleteState {
  isActive: boolean
  suggestion: string
  isLoading: boolean
  error: string | null
}

export interface UseLLMAutocompleteProps {
  quillRef: React.RefObject<any>
}

export function useLLMAutocomplete({ quillRef }: UseLLMAutocompleteProps) {
  const [state, setState] = useState<LLMAutocompleteState>({
    isActive: false,
    suggestion: '',
    isLoading: false,
    error: null
  })

  const abortControllerRef = useRef<AbortController | null>(null)
  const autocompleteMutation = useAutocomplete()

  // Get context from the editor (previous sentences)
  const getContext = useCallback(() => {
    if (!quillRef.current) return ''
    
    const quill = quillRef.current.getEditor()
    const selection = quill.getSelection()
    
    if (!selection) return ''
    
    // Get all text before the current cursor position
    const textBeforeCursor = quill.getText(0, selection.index)
    
    // Split into sentences and get the last few sentences as context
    const sentences = textBeforeCursor.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const contextSentences = sentences.slice(-3) // Get last 3 sentences
    
    return contextSentences.join('. ').trim()
  }, [quillRef])

  // Get current incomplete sentence
  const getCurrentSentence = useCallback(() => {
    if (!quillRef.current) return ''
    
    const quill = quillRef.current.getEditor()
    const selection = quill.getSelection()
    
    if (!selection) return ''
    
    const textBeforeCursor = quill.getText(0, selection.index)
    const sentences = textBeforeCursor.split(/[.!?]+/)
    const currentSentence = sentences[sentences.length - 1] || ''
    
    return currentSentence.trim()
  }, [quillRef])

  // Call backend for LLM autocomplete using TanStack Query
  const generateSuggestion = useCallback(async () => {
    if (!quillRef.current) return

    const context = getContext()
    const currentSentence = getCurrentSentence()
    
    if (!currentSentence) {
      console.log('No current sentence to complete')
      return
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController()

    try {
      console.log('🤖 Calling backend for LLM autocomplete...')
      console.log('📝 Context:', context)
      console.log('🔤 Current sentence:', currentSentence)

      // Use TanStack Query mutation
      const result = await autocompleteMutation.mutateAsync({
        context,
        currentSentence,
        maxTokens: 50
      })
      
      if (result.suggestion) {
        setState(prev => ({
          ...prev,
          isActive: true,
          suggestion: result.suggestion,
          isLoading: false,
          error: null
        }))
        
        // Insert the suggestion as grey text
        insertGreySuggestion(result.suggestion)
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'No suggestion received'
        }))
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('🚫 Autocomplete request cancelled')
        return
      }
      
      console.error('💥 Error generating suggestion:', error)
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'Failed to generate suggestion'
      }))
    }
  }, [quillRef, getContext, getCurrentSentence, autocompleteMutation])

  // Insert suggestion as grey text
  const insertGreySuggestion = useCallback((suggestion: string) => {
    if (!quillRef.current) return

    const quill = quillRef.current.getEditor()
    const selection = quill.getSelection()
    
    if (!selection) return

    // Insert the suggestion with grey color
    quill.insertText(selection.index, suggestion, {
      color: '#888888' // Grey color
    })

    // Position cursor at the end of the suggestion
    quill.setSelection(selection.index + suggestion.length, 0)
  }, [quillRef])

  // Accept the suggestion (convert grey to normal text)
  const acceptSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) return

    const quill = quillRef.current.getEditor()
    const selection = quill.getSelection()
    
    if (!selection) return

    // Find the grey text and convert it to normal text
    const text = quill.getText()
    
    // Find the grey text by looking for the suggestion
    const suggestionIndex = text.indexOf(state.suggestion)
    if (suggestionIndex !== -1) {
      // Remove the grey formatting and apply normal formatting
      quill.formatText(suggestionIndex, state.suggestion.length, {
        color: false // Remove grey color
      })
      
      // Move cursor to the end of the accepted text
      quill.setSelection(suggestionIndex + state.suggestion.length, 0)
    }

    // Clear the suggestion state
    setState(prev => ({
      ...prev,
      isActive: false,
      suggestion: '',
      error: null
    }))
  }, [quillRef, state.isActive, state.suggestion])

  // Cancel the suggestion
  const cancelSuggestion = useCallback(() => {
    if (!quillRef.current || !state.isActive) return

    const quill = quillRef.current.getEditor()
    const selection = quill.getSelection()
    
    if (!selection) return

    // Find and remove the grey suggestion text
    const text = quill.getText()
    
    const suggestionIndex = text.indexOf(state.suggestion)
    if (suggestionIndex !== -1) {
      quill.deleteText(suggestionIndex, state.suggestion.length)
    }

    // Clear the suggestion state
    setState(prev => ({
      ...prev,
      isActive: false,
      suggestion: '',
      error: null
    }))
  }, [quillRef, state.isActive, state.suggestion])

  // Handle tab key press
  const handleTabPress = useCallback(() => {
    if (state.isActive) {
      // Second tab - accept the suggestion
      acceptSuggestion()
    } else {
      // First tab - generate suggestion
      generateSuggestion()
    }
  }, [state.isActive, acceptSuggestion, generateSuggestion])

  // Handle escape key press
  const handleEscapePress = useCallback(() => {
    if (state.isActive) {
      cancelSuggestion()
    }
  }, [state.isActive, cancelSuggestion])

  // Cleanup on unmount
  const cleanup = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }, [])

  return {
    state,
    handleTabPress,
    handleEscapePress,
    cleanup
  }
}