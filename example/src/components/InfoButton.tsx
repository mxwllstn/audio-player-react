export function InfoButton({ open, className }: { open?: boolean; className?: string }) {
  if (open) {
    return (
      <svg className={className} width="100%" height="100%" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fillRule="evenodd" clipRule="evenodd" d="M4.5 5.25L9 9.75L13.5 5.25L15 6.75L9 12.75L3 6.75L4.5 5.25Z" fill="black" />
      </svg>
    )
  }
  return (
    <svg className={className} width="100%" height="100%" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path fillRule="evenodd" clipRule="evenodd" d="M3 11.25L9 5.25L15 11.25L13.5 12.75L9 8.25L4.5 12.75L3 11.25Z" fill="black" />
    </svg>
  )
}
