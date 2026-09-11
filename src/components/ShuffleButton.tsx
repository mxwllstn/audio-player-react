export function ShuffleButton({ className, onClick }: { className?: string; onClick?: () => void }) {
  return (
    <svg className={className} onClick={onClick} width="18" height="14" viewBox="0 0 18 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M1 12C0.734783 12 0.480429 11.8946 0.292893 11.7071C0.105357 11.5196 0 11.2652 0 11C0 10.7348 0.105357 10.4804 0.292893 10.2929C0.480429 10.1054 0.734783 10 1 10H3L6 7L3 4H1C0.74252 3.98848 0.499405 3.87809 0.321276 3.69182C0.143147 3.50554 0.0437326 3.25774 0.0437326 3C0.0437326 2.74226 0.143147 2.49446 0.321276 2.30818C0.499405 2.12191 0.74252 2.01152 1 2H4L8 6L12 2H14V0L18 3.001L14 6V4H13L10 7L13 10H14V8L18 11L14 14V12H12L8 8L4 12H1Z"
        fill="black"
      />
    </svg>
  )
}
