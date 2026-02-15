export function LoadingSpinner({ size = 'md' }: { size?: 'xs' | 'sm' | 'md' | 'lg' }) {
  const sizeMap = { xs: 'h-3 w-3', sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div
      className={`${sizeMap[size]} animate-spin rounded-full border-2 border-cyan-500/20 border-t-cyan-400`}
    />
  );
}
