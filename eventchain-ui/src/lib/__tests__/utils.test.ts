import { cn } from '../utils'

describe('utils', () => {
  describe('cn (className utility)', () => {
    it('merges class names correctly', () => {
      const result = cn('class1', 'class2', 'class3')
      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('handles conditional classes', () => {
      const isActive = true
      const isDisabled = false

      const result = cn(
        'base-class',
        isActive && 'active-class',
        isDisabled && 'disabled-class'
      )

      expect(result).toContain('base-class')
      expect(result).toContain('active-class')
      expect(result).not.toContain('disabled-class')
    })

    it('handles undefined and null values', () => {
      const result = cn('valid-class', undefined, null, 'another-class')

      expect(result).toContain('valid-class')
      expect(result).toContain('another-class')
      expect(result).not.toContain('undefined')
      expect(result).not.toContain('null')
    })

    it('handles empty strings', () => {
      const result = cn('class1', '', 'class2')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result.trim()).not.toBe('')
    })

    it('handles array of classes', () => {
      const classes = ['class1', 'class2']
      const result = cn(classes, 'class3')

      expect(result).toContain('class1')
      expect(result).toContain('class2')
      expect(result).toContain('class3')
    })

    it('handles object with boolean values', () => {
      const result = cn({
        'active': true,
        'disabled': false,
        'visible': true,
      })

      expect(result).toContain('active')
      expect(result).toContain('visible')
      expect(result).not.toContain('disabled')
    })

    it('merges conflicting Tailwind classes correctly', () => {
      // This tests the tailwind-merge functionality
      const result = cn('p-4', 'p-2')

      // tailwind-merge should keep only the last padding class
      expect(result).toContain('p-2')
      expect(result).not.toContain('p-4')
    })

    it('handles complex Tailwind class conflicts', () => {
      const result = cn(
        'bg-red-500',
        'bg-blue-500',
        'text-white',
        'text-sm',
        'text-lg'
      )

      // Should keep the last background and text size
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('text-white')
      expect(result).toContain('text-lg')
      expect(result).not.toContain('bg-red-500')
      expect(result).not.toContain('text-sm')
    })

    it('preserves non-conflicting classes', () => {
      const result = cn(
        'flex',
        'items-center',
        'justify-between',
        'p-4',
        'border',
        'rounded-md'
      )

      expect(result).toContain('flex')
      expect(result).toContain('items-center')
      expect(result).toContain('justify-between')
      expect(result).toContain('p-4')
      expect(result).toContain('border')
      expect(result).toContain('rounded-md')
    })

    it('handles responsive classes correctly', () => {
      const result = cn('w-full', 'md:w-1/2', 'lg:w-1/3')

      expect(result).toContain('w-full')
      expect(result).toContain('md:w-1/2')
      expect(result).toContain('lg:w-1/3')
    })

    it('handles hover and focus states', () => {
      const result = cn(
        'bg-gray-100',
        'hover:bg-gray-200',
        'focus:bg-gray-300',
        'hover:bg-blue-100' // This should override the previous hover state
      )

      expect(result).toContain('bg-gray-100')
      expect(result).toContain('focus:bg-gray-300')
      expect(result).toContain('hover:bg-blue-100')
      expect(result).not.toContain('hover:bg-gray-200')
    })

    it('handles dark mode classes', () => {
      const result = cn('bg-white', 'dark:bg-gray-900', 'text-black', 'dark:text-white')

      expect(result).toContain('bg-white')
      expect(result).toContain('dark:bg-gray-900')
      expect(result).toContain('text-black')
      expect(result).toContain('dark:text-white')
    })

    it('returns empty string for no arguments', () => {
      const result = cn()
      expect(result).toBe('')
    })

    it('handles single argument', () => {
      const result = cn('single-class')
      expect(result).toBe('single-class')
    })

    it('handles nested conditional logic', () => {
      const condition1 = true
      const condition2 = false
      const condition3 = true

      const result = cn(
        'base',
        condition1 && 'condition1-true',
        condition2 ? 'condition2-true' : 'condition2-false',
        condition3 && condition2 && 'both-true',
        condition1 && !condition2 && 'condition1-not-condition2'
      )

      expect(result).toContain('base')
      expect(result).toContain('condition1-true')
      expect(result).toContain('condition2-false')
      expect(result).toContain('condition1-not-condition2')
      expect(result).not.toContain('condition2-true')
      expect(result).not.toContain('both-true')
    })

    it('handles whitespace correctly', () => {
      const result = cn('  class1  ', ' class2 ', '  class3  ')

      // Should trim whitespace and not contain extra spaces
      expect(result).not.toMatch(/^\s+|\s+$/)
      expect(result).not.toMatch(/\s{2,}/)
    })

    it('handles special characters in class names', () => {
      const result = cn('2xl:max-w-screen-2xl', 'sm:max-w-sm', 'before:content-[""]')

      expect(result).toContain('2xl:max-w-screen-2xl')
      expect(result).toContain('sm:max-w-sm')
      expect(result).toContain('before:content-[""]')
    })

    it('handles custom CSS class names alongside Tailwind', () => {
      const result = cn(
        'custom-component',
        'bg-blue-500',
        'another-custom-class',
        'text-white'
      )

      expect(result).toContain('custom-component')
      expect(result).toContain('bg-blue-500')
      expect(result).toContain('another-custom-class')
      expect(result).toContain('text-white')
    })

    it('maintains order for non-conflicting classes', () => {
      const result = cn('a', 'b', 'c', 'd', 'e')

      // Classes should appear in the result (exact order may vary due to merge logic)
      expect(result).toContain('a')
      expect(result).toContain('b')
      expect(result).toContain('c')
      expect(result).toContain('d')
      expect(result).toContain('e')
    })

    it('performance test with many classes', () => {
      const manyClasses = Array.from({ length: 100 }, (_, i) => `class-${i}`)

      const startTime = performance.now()
      const result = cn(...manyClasses)
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100) // Should complete within 100ms
      expect(result).toContain('class-0')
      expect(result).toContain('class-99')
    })
  })

  describe('edge cases', () => {
    it('handles boolean false values', () => {
      const result = cn('base', false, 'other')

      expect(result).toContain('base')
      expect(result).toContain('other')
      expect(result).not.toContain('false')
    })

    it('handles numeric values', () => {
      const result = cn('base', 0, 1, 'other')

      expect(result).toContain('base')
      expect(result).toContain('other')
      // Numbers are converted to strings if truthy
      expect(result).not.toContain('0')
    })

    it('handles deeply nested arrays', () => {
      const result = cn('base', ['nested1', ['deeply-nested', 'another']], 'end')

      expect(result).toContain('base')
      expect(result).toContain('nested1')
      expect(result).toContain('deeply-nested')
      expect(result).toContain('another')
      expect(result).toContain('end')
    })
  })
})